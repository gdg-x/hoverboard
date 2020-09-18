import '@polymer/app-route/app-route';
import { customElement, observe, property } from '@polymer/decorators';
import '@polymer/iron-ajax/iron-ajax';
import '@polymer/marked-element';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import '../elements/posts-list';
import '../elements/shared-styles';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState, store } from '../store';
import { fetchBlogList } from '../store/blog/actions';
import { getDate } from '../utils/functions';

@customElement('post-page')
export class PostPage extends ReduxMixin(PolymerElement) {
  @property({ type: Boolean })
  active = false;
  @property({ type: Object })
  route: object;

  @property({ type: Array })
  private post = {};
  @property({ type: Array })
  private postsList = [];
  @property({ type: Array })
  private suggestedPosts = [];
  @property({ type: Array })
  private postsMap = {};
  @property({ type: Boolean })
  private postsFetching = false;
  @property({ type: Array })
  private postsFetchingError = {};
  @property({ type: Array })
  private viewport = {};
  @property({ type: Object })
  private postData: { id?: string } = {};
  @property({ type: Object })
  private postContent: object;

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
        active="[[active]]"
        label1="{$ blog.published $}"
        data1="[[published]]"
      ></polymer-helmet>

      <app-route route="[[route]]" pattern="/:id" data="{{postData}}"></app-route>

      <hero-block
        background-image="[[post.image]]"
        background-color="[[post.primaryColor]]"
        font-color="#fff"
        active="[[active]]"
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

  stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
    this.postsList = state.blog.list;
    this.postsMap = state.blog.obj;
    this.postsFetching = state.blog.fetching;
    this.postsFetchingError = state.blog.fetchingError;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.postsFetching && (!this.postsList || !this.postsList.length)) {
      store.dispatch(fetchBlogList());
    }
  }

  handleMarkdownFileFetch(event) {
    if (event.detail.response) {
      this.postContent = event.detail.response;
    }
  }

  @observe('postData.id', 'postsList', 'postsMap')
  _postDataObserver(postId: string, postsList, postsMap) {
    if (!postsList || !postsList.length || !postsMap[postId]) {
      return;
    }

    const post = this.postsMap[this.postData.id];
    this.post = post;
    this.postContent = post.content;
    this.suggestedPosts = postsList.filter((post) => post.id !== this.postData.id).slice(0, 3);
  }

  getDate(date) {
    return getDate(date);
  }
}
