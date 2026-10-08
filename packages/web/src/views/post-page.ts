import { Failure, Initialized, type RemoteData, Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../components/hero/hero-block';
import { heroText } from '../components/hero/hero-block';
import '../components/markdown/long-markdown';
import '../components/shared/posts-list';
import { StoreController } from '../controllers/store-controller';
import type { Post } from '../models/post';
import { goto } from '../utils/navigation';
import { store } from '../store';
import { type BlogState, selectBlogPosts } from '../store/blog';
import { getDate } from '../utils/dates';
import { fetchText } from '../utils/fetch-text';
import { updateImageMetadata } from '../utils/metadata';
import { ThemedElement } from '../components/themed-element';

@customElement('post-page')
export class PostPage extends ThemedElement {
  static override styles = [
    heroText,
    css`
      .post {
        margin-bottom: 32px;
      }

      .date {
        font-size: 12px;
        text-transform: uppercase;
        color: var(--secondary-text-color);
      }

      .suggested-posts {
        margin: 24px 0 -20px;
        padding-top: 24px;
        background-color: var(--primary-background-color);
      }

      @media (min-width: 640px) {
        .suggested-posts {
          margin-top: 48px;
          padding-bottom: 36px;
        }
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
      <hero-block tone="2" background-image=${post?.image ?? ''}>
        <h1 class="hero-title">${post?.title ?? ''}</h1>
      </hero-block>

      <div class="container-narrow">
        <long-markdown class="post" .content=${this.postContent}></long-markdown>
        <div class="date">${msg(str`Published: ${published}`, { id: 'pages.post.published' })}</div>
      </div>

      <div class="suggested-posts">
        <div class="container-narrow">
          <h3 class="container-title">${msg('Up next', { id: 'pages.post.up-next' })}</h3>
          <posts-list .posts=${this.suggestedPosts}></posts-list>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'post-page': PostPage;
  }
}
