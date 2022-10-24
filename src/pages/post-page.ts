import { Failure, Initialized, RemoteData, Success } from '@abraham/remotedata';
import { customElement, observe, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { RouterLocation } from '@vaadin/router';
import '../components/hero/hero-block';
import '../components/markdown/long-markdown';
import '../elements/footer-block';
import '../elements/posts-list';
import '../elements/shared-styles';
import { Post } from '../models/post';
import { router } from '../router';
import { RootState, store } from '../store';
import { fetchBlogPosts } from '../store/blog/actions';
import { BlogState, initialBlogState } from '../store/blog/state';
import { ReduxMixin } from '../store/mixin';
import { blog } from '../utils/data';
import { getDate } from '../utils/dates';
import { updateImageMetadata } from '../utils/metadata';

// TODO: loading message

@customElement('post-page')
export class PostPage extends ReduxMixin(PolymerElement) {
  @property({ type: Object })
  posts = initialBlogState;

  @property({ type: Object })
  private post: RemoteData<Error, Post> = new Initialized();
  @property({ type: Array })
  private suggestedPosts: Post[] = [];
  @property({ type: String })
  private postContent: string = '';
  @property({ type: Object })
  private postData: { id?: string } = {};

  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
        }

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
      </style>

      <hero-block
        background-image="[[post.data.image]]"
        background-color="[[post.data.primaryColor]]"
        font-color="#fff"
      >
        <div class="hero-title">[[post.data.title]]</div>
      </hero-block>

      <div class="container-narrow">
        <long-markdown class="post" content="[[postContent]]"></long-markdown>
        <div class="date">[[blog.published]]: [[getDate(post.data.published)]]</div>
      </div>

      <div class="suggested-posts">
        <div class="container-narrow">
          <h3 class="container-title">[[blog.suggested]]</h3>
          <posts-list posts="[[suggestedPosts]]"></posts-list>
        </div>
      </div>

      <footer-block></footer-block>
    `;
  }

  override stateChanged(state: RootState) {
    this.posts = state.blog;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.posts instanceof Initialized) {
      store.dispatch(fetchBlogPosts);
    }
  }

  private blog = blog;

  @observe('post')
  private async onPost(post: RemoteData<Error, Post>) {
    if (post instanceof Success && post.data.source) {
      try {
        this.postContent = await fetch(post.data.source).then((response) => response.text());
      } catch (error) {
        this.post = new Failure(error as Error);
      }
    }
  }

  onAfterEnter(location: RouterLocation) {
    this.postData = location.params;
  }

  // TODO: Move to selector
  @observe('postData.id', 'posts')
  private onPostDataIdAndPosts(postId: string, posts: BlogState) {
    if (postId && posts instanceof Success) {
      const post = posts.data.find(({ id }) => id === postId);
      if (post) {
        this.post = new Success(post);
        this.postContent = post?.content;
        this.suggestedPosts = posts.data.filter(({ id }) => id !== postId).slice(0, 3);

        updateImageMetadata(post.title, post.brief, {
          image: post.image,
          imageAlt: post.title,
        });
      } else {
        router.render('/404');
      }
    }
  }

  private getDate(date: string) {
    return getDate(date);
  }
}
