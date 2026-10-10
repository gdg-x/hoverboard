import { Failure, Initialized, type RemoteData, Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import '../components/hero/hero-block';
import { heroText } from '../components/hero/hero-block';
import { PAGE_TONES } from '../components/hero/simple-hero';
import '../components/markdown/long-markdown';
import '../components/shared/hoverboard-icon';
import '../components/shared/posts-list';
import { StoreController } from '../controllers/store-controller';
import type { Post } from '../models/post';
import { goto } from '../utils/navigation';
import { store } from '../store';
import { type BlogState, selectBlogPosts } from '../store/blog';
import { getDate } from '../utils/dates';
import { fetchText } from '../utils/fetch-text';
import { updateImageMetadata } from '../utils/metadata';
import { pageInner } from '../styles/page';
import { ThemedComponent } from '../components/themed-component';

/** A blog post in a reading layout, and the next posts to read. */
@customElement('post-page')
export class PostPage extends ThemedComponent {
  static override styles = [
    heroText,
    pageInner,
    css`
      .published {
        margin: var(--hb-space-4) 0 0;
        font: 500 var(--hb-text-md) / 1.4 var(--hb-font-mono);
      }

      .cover {
        display: block;
        inline-size: 100%;
        max-inline-size: var(--hb-prose-max);
        block-size: auto;
        aspect-ratio: 16 / 9;
        margin-block-end: var(--hb-space-7);
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-l);
        box-shadow: var(--hb-shadow-card);
        object-fit: cover;
      }

      .up-next {
        background-color: var(--hb-color-surface-container);
      }

      .up-next-title {
        margin: 0 0 var(--hb-space-5);
        padding: 0;
        font: 800 var(--hb-text-3xl) / 1.1 var(--hb-font-display);
      }
    `,
  ];

  // Starts from the store, so a page seeded on the server renders its post.
  @property({ attribute: false })
  accessor posts: BlogState = selectBlogPosts(store.getState());

  @property({ attribute: false })
  accessor postId: string | undefined;

  @state()
  private accessor post: RemoteData<Error, Post> = new Initialized();
  @state()
  private accessor suggestedPosts: Post[] = [];
  @state()
  private accessor postContent = '';

  private contentRequest = 0;

  private readonly postsStore = new StoreController(this, selectBlogPosts, {
    onChange: (value) => {
      this.posts = value;
    },
  });

  private get foundPost(): Post | undefined {
    return this.posts instanceof Success
      ? this.posts.data.find(({ id }) => id === this.postId)
      : undefined;
  }

  private get isLoaded() {
    return !!this.postId && this.posts instanceof Success;
  }

  // Runs on the server too, so the page renders the post. Side effects wait for `updated`.
  override willUpdate(changed: Map<string, unknown>) {
    if ((changed.has('posts') || changed.has('postId')) && this.isLoaded) {
      const post = this.foundPost;
      if (post) {
        this.post = new Success(post);
        this.postContent = post.content;
        this.suggestedPosts = (this.posts as Success<Post[]>).data
          .filter(({ id }) => id !== post.id)
          .slice(0, 3);
      }
    }
  }

  override updated(changed: Map<string, unknown>) {
    if ((changed.has('posts') || changed.has('postId')) && this.isLoaded) {
      const post = this.foundPost;
      if (!post) {
        goto('/404');
        return;
      }
      updateImageMetadata(post.title, post.brief, {
        image: post.image,
        imageAlt: post.title,
      });
      void this.loadPostContent(post);
    }
  }

  private async loadPostContent(post: Post) {
    const request = ++this.contentRequest;
    if (!post.source) {
      return;
    }

    try {
      const content = await fetchText(post.source);
      if (request === this.contentRequest) {
        this.postContent = content;
      }
    } catch (error) {
      if (request !== this.contentRequest) {
        return;
      }
      // The inline content is already shown, so a broken source only matters without it.
      if (post.content) {
        console.error(`Failed to load source for post ${post.id}:`, error);
      } else {
        this.post = new Failure(error as Error);
      }
    }
  }

  override render() {
    const post = this.post instanceof Success ? this.post.data : undefined;
    const published = post ? getDate(post.published) : '';

    return html`
      <hero-block tone="${PAGE_TONES.blog}">
        <a class="back" href="/blog">
          <hoverboard-icon name="arrow-left"></hoverboard-icon>
          ${msg('All posts', { id: 'pages.post.all-posts' })}
        </a>
        <h1 class="hero-title">${post?.title ?? ''}</h1>
        <p class="published">
          ${msg(str`Published: ${published}`, { id: 'pages.post.published' })}
        </p>
      </hero-block>

      <article class="inner">
        ${
          post?.image
            ? html`<img
                class="cover"
                src="${post.image}"
                alt=""
                decoding="async"
                style="${styleMap({ backgroundColor: post.backgroundColor })}"
              />`
            : nothing
        }
        <long-markdown class="post" .content=${this.postContent}></long-markdown>
      </article>

      ${
        this.suggestedPosts.length
          ? html`<section class="up-next" aria-labelledby="up-next">
              <div class="inner">
                <h2 class="up-next-title" id="up-next">
                  ${msg('Up next', { id: 'pages.post.up-next' })}
                </h2>
                <posts-list heading-level="3" .posts=${this.suggestedPosts}></posts-list>
              </div>
            </section>`
          : nothing
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'post-page': PostPage;
  }
}
