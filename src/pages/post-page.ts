import { Initialized, Success } from '@abraham/remotedata';
import { customElement, observe, property } from '@polymer/decorators';
import '@polymer/iron-ajax/iron-ajax';
import '@polymer/marked-element';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import { RouterLocation } from '@vaadin/router';
import 'plastic-image';
import '../elements/posts-list';
import '../elements/shared-styles';
import { ReduxMixin } from '../mixins/redux-mixin';
import { Post } from '../models/post';
import { router } from '../router';
import { RootState, store } from '../store';
import { fetchBlogPosts } from '../store/blog/actions';
import { BlogState, initialBlogState } from '../store/blog/state';
import { getDate } from '../utils/functions';

@customElement('post-page')
export class PostPage extends ReduxMixin(PolymerElement) {
  @property({ type: Object })
  posts = initialBlogState;

  @property({ type: Object })
  private post: Post;
  @property({ type: Array })
  private suggestedPosts: Post[] = [];
  @property({ type: String })
  private postContent: string;
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

        [slot='markdown-html'] {
          font-size: 18px;
          line-height: 1.8;
          color: var(--primary-text-color);
        }

        [slot='markdown-html'] h1,
        [slot='markdown-html'] h2,
        [slot='markdown-html'] h3 {
          margin: 48px 0 16px;
        }

        [slot='markdown-html'] p {
          margin-top: 0;
          margin-bottom: 24px;
        }

        [slot='markdown-html'] img {
          width: 100%;
        }

        [slot='markdown-html'] plastic-image {
          margin: 32px 0 8px -16px;
          --iron-image-width: calc(100% + 32px);
          width: calc(100% + 32px);
          min-height: 200px;
          background-color: var(--secondary-background-color);
        }

        @media (min-width: 640px) {
          [slot='markdown-html'] plastic-image {
            min-height: 400px;
          }

          .suggested-posts {
            margin-top: 48px;
            padding-bottom: 36px;
          }
        }
      </style>

      <polymer-helmet
        title="[[post.title]] | {$ title $}"
        description="[[post.brief]]"
        image="[[post.image]]"
        label1="{$ blog.published $}"
        data1="[[published]]"
      ></polymer-helmet>

      <hero-block
        background-image="[[post.image]]"
        background-color="[[post.primaryColor]]"
        font-color="#fff"
      >
        <div class="hero-title">[[post.title]]</div>
      </hero-block>

      <div class="container-narrow">
        <marked-element class="post" markdown="[[postContent]]">
          <div slot="markdown-html"></div>
        </marked-element>
        <div class="date">{$ blog.published $}: [[getDate(post.published)]]</div>
      </div>

      <div class="suggested-posts">
        <div class="container-narrow">
          <h3 class="container-title">{$ blog.suggested $}</h3>
          <posts-list posts="[[suggestedPosts]]"></posts-list>
        </div>
      </div>

      <iron-ajax
        auto
        url="[[post.source]]"
        handle-as="text"
        on-response="handleMarkdownFileFetch"
      ></iron-ajax>
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

  onAfterEnter(location: RouterLocation) {
    this.postData = location.params;
  }

  handleMarkdownFileFetch(event: CustomEvent) {
    if (event.detail.response) {
      this.postContent = event.detail.response;
    }
  }

  // TODO: Move to selector
  @observe('postData.id', 'posts')
  _postDataObserver(postId: string, posts: BlogState) {
    if (postId && posts instanceof Success) {
      const post = posts.data.find(({ id }) => id === postId);
      if (post) {
        this.post = post;
        this.postContent = post?.content;
        this.suggestedPosts = posts.data.filter(({ id }) => id !== postId).slice(0, 3);
      } else {
        router.render('/404');
      }
    }
  }

  getDate(date: string) {
    return getDate(date);
  }
}
