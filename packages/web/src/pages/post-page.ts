import { Failure, Initialized, RemoteData, Success } from '@abraham/remotedata';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { RouterLocation } from '@vaadin/router';
import '../components/footer-block';
import '../components/hero/hero-block';
import '../components/markdown/long-markdown';
import '../components/posts-list';
import { ThemedElement } from '../components/themed-element';
import { Post } from '../models/post';
import { router } from '../router';
import { RootState } from '../store';
import { BlogState, selectBlogPosts } from '../store/blog';
import { ReduxMixin } from '../store/mixin';
import { blog } from '../utils/data';
import { getDate } from '../utils/dates';
import { updateImageMetadata } from '../utils/metadata';

@customElement('post-page')
export class PostPage extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
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
  }

  @property({ type: Object })
  posts: BlogState = new Initialized();

  @state()
  private post: RemoteData<Error, Post> = new Initialized();
  @state()
  private suggestedPosts: Post[] = [];
  @state()
  private postContent = '';
  @state()
  private postData: { id?: string } = {};

  private blog = blog;
  private contentRequest = 0;

  override stateChanged(state: RootState) {
    this.posts = selectBlogPosts(state);
    this.updatePost();
  }

  onAfterEnter(location: RouterLocation) {
    this.postData = location.params;
    this.updatePost();
  }

  private updatePost() {
    const postId = this.postData.id;
    if (!postId || !(this.posts instanceof Success)) {
      return;
    }

    const post = this.posts.data.find(({ id }) => id === postId);
    if (!post) {
      router.render('/404');
      return;
    }

    this.post = new Success(post);
    this.postContent = post.content;
    this.suggestedPosts = this.posts.data.filter(({ id }) => id !== postId).slice(0, 3);
    updateImageMetadata(post.title, post.brief, {
      image: post.image,
      imageAlt: post.title,
    });
    void this.loadPostContent(post);
  }

  private async loadPostContent(post: Post) {
    const request = ++this.contentRequest;
    if (!post.source) {
      return;
    }

    try {
      const content = await fetch(post.source).then((response) => response.text());
      if (request === this.contentRequest) {
        this.postContent = content;
      }
    } catch (error) {
      if (request === this.contentRequest) {
        this.post = new Failure(error as Error);
      }
    }
  }

  override render() {
    const post =
      this.post instanceof Success
        ? (this.post.data as Post & { primaryColor?: string })
        : undefined;

    return html`
      <hero-block
        background-image=${post?.image ?? ''}
        background-color=${post?.primaryColor ?? ''}
        font-color="#fff"
      >
        <div class="hero-title">${post?.title ?? ''}</div>
      </hero-block>

      <div class="container-narrow">
        <long-markdown class="post" .content=${this.postContent}></long-markdown>
        <div class="date">${this.blog.published}: ${post ? getDate(post.published) : ''}</div>
      </div>

      <div class="suggested-posts">
        <div class="container-narrow">
          <h3 class="container-title">${this.blog.suggested}</h3>
          <posts-list .posts=${this.suggestedPosts}></posts-list>
        </div>
      </div>

      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'post-page': PostPage;
  }
}
