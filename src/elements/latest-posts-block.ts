import '@polymer/iron-icon';
import '@polymer/marked-element';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { ReduxMixin } from '../mixins/redux-mixin';
import { blogActions } from '../redux/actions';
import { State, store } from '../redux/store';
import { getDate } from '../utils/functions';
import './shared-styles';
import './text-truncate';

class LatestPostsBlock extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
        }

        .posts-wrapper {
          display: grid;
          grid-template-columns: 1fr;
          grid-gap: 16px;
        }

        .image {
          width: 100%;
          height: 128px;
          border-top-left-radius: var(--border-radius);
          border-top-right-radius: var(--border-radius);
        }

        .details {
          padding: 16px;
        }

        .title {
          font-size: 20px;
          line-height: 1.2;
        }

        .description {
          margin-top: 8px;
          color: var(--secondary-text-color);
        }

        .date {
          margin-top: 16px;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--secondary-text-color);
        }

        .cta-button {
          margin-top: 24px;
        }

        @media (min-width: 640px) {
          .posts-wrapper {
            grid-template-columns: repeat(3, 1fr);
          }

          .post:last-of-type {
            display: none;
          }
        }

        @media (min-width: 812px) {
          .posts-wrapper {
            grid-template-columns: repeat(4, 1fr);
          }

          .post:last-of-type {
            display: flex;
          }
        }
      </style>

      <div class="container">
        <h1 class="container-title">{$ latestPostsBlock.title $}</h1>

        <div class="posts-wrapper">
          <template is="dom-repeat" items="[[posts]]" as="post">
            <a
              href$="/blog/posts/[[post.id]]/"
              class="post card"
              ga-on="click"
              ga-event-category="blog"
              ga-event-action="open post"
              ga-event-label$="[[post.title]]"
              flex
              layout
              vertical
            >
              <plastic-image
                class="image"
                srcset="[[post.image]]"
                style$="background-color: [[post.backgroundColor]];"
                sizing="cover"
                lazy-load
                preload
                fade
              ></plastic-image>
              <div class="details" layout vertical justified flex-auto>
                <div>
                  <text-truncate lines="2">
                    <h3 class="title">[[post.title]]</h3>
                  </text-truncate>
                  <text-truncate lines="3">
                    <marked-element class="description" markdown="[[post.brief]]">
                      <div slot="markdown-html"></div>
                    </marked-element>
                  </text-truncate>
                </div>
                <div class="date">[[getDate(post.published)]]</div>
              </div>
            </a>
          </template>
        </div>

        <a href="{$ latestPostsBlock.callToAction.link $}">
          <paper-button class="cta-button animated icon-right">
            <span>{$ latestPostsBlock.callToAction.label $}</span>
            <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
          </paper-button>
        </a>
      </div>
    `;
  }

  static get is() {
    return 'latest-posts-block';
  }

  private viewport = {};
  private posts = [];
  private postsList = [];
  private postsFetching = false;
  private postsFetchingError = {};

  static get properties() {
    return {
      viewport: Object,
      posts: Array,
      postsList: {
        type: Array,
        observer: '_transformPosts',
      },
      postsFetching: Boolean,
      postsFetchingError: Object,
    };
  }

  stateChanged(state: State) {
    return this.setProperties({
      viewport: state.ui.viewport,
      postsList: state.blog.list,
      postsFetching: state.blog.fetching,
      postsFetchingError: state.blog.fetchingError,
    });
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.postsFetching && (!this.postsList || !this.postsList.length)) {
      store.dispatch(blogActions.fetchList());
    }
  }

  _transformPosts(postsList) {
    this.set('posts', postsList.slice(0, 4));
  }

  getDate(date) {
    return getDate(date);
  }
}

window.customElements.define(LatestPostsBlock.is, LatestPostsBlock);
