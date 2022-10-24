import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { computed, customElement, property } from '@polymer/decorators';
import '@polymer/paper-progress';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import '../components/hero/simple-hero';
import '../components/text-truncate';
import '../elements/content-loader';
import '../elements/footer-block';
import '../elements/posts-list';
import '../elements/shared-styles';
import { Post } from '../models/post';
import { router } from '../router';
import { RootState, store } from '../store';
import { fetchBlogPosts } from '../store/blog/actions';
import { initialBlogState } from '../store/blog/state';
import { ReduxMixin } from '../store/mixin';
import { initialUiState } from '../store/ui/state';
import { contentLoaders, heroSettings } from '../utils/data';
import { getDate } from '../utils/dates';
import { updateMetadata } from '../utils/metadata';

@customElement('blog-list-page')
export class BlogListPage extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          display: block;
        }

        .featured-posts-wrapper {
          grid-template-columns: 1fr;
          display: grid;
          grid-gap: 24px;
        }

        .featured {
          background-color: var(--secondary-background-color);
        }

        .featured-post {
          height: 200px;
          border-radius: var(--border-radius);
          overflow: hidden;
        }

        .image {
          position: absolute;
          --lazy-image-width: 100%;
          --lazy-image-height: 100%;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
        }

        .image-overlay {
          background-color: rgba(0, 0, 0, 0.6);
        }

        .details {
          padding: 24px;
          height: 100%;
          transform: translateZ(0);
          color: #fff;
          box-sizing: border-box;
        }

        .title {
          line-height: 1.2;
        }

        .description {
          padding-top: 8px;
          opacity: 0.8;
        }

        .date {
          font-size: 12px;
          text-transform: uppercase;
          opacity: 0.8;
        }

        paper-progress {
          width: 100%;
          --paper-progress-active-color: var(--default-primary-color);
          --paper-progress-secondary-color: var(--default-primary-color);
        }

        @media (min-width: 640px) {
          .featured-posts-wrapper {
            grid-template-columns: repeat(3, 1fr);
          }

          .featured-post {
            height: 256px;
          }
        }
      </style>

      <simple-hero page="blog"></simple-hero>

      <paper-progress indeterminate hidden$="[[contentLoaderVisibility]]"></paper-progress>

      <div class="featured">
        <div class="container">
          <content-loader
            class="featured-posts-wrapper"
            card-padding="24px"
            card-height="256px"
            border-radius="var(--border-radius)"
            title-top-position="32px"
            title-height="42px"
            title-width="70%"
            load-from="-70%"
            load-to="130%"
            animation-time="1s"
            items-count="[[contentLoaders.itemsCount]]"
            hidden$="[[contentLoaderVisibility]]"
          >
          </content-loader>

          <div class="featured-posts-wrapper">
            <template is="dom-if" if="[[failure]]">
              <p>Error loading posts.</p>
            </template>

            <template is="dom-repeat" items="[[featuredPosts]]" as="post">
              <a
                href$="[[postUrl(post.id)]]"
                class="featured-post"
                flex$="[[viewport.isTabletPlus]]"
                relative
              >
                <lazy-image
                  class="image"
                  src$="[[post.image]]"
                  alt="[[post.title]]"
                  style$="background-color: [[post.backgroundColor]];"
                ></lazy-image>

                <div class="image-overlay" fit></div>
                <div class="details" layout vertical justified>
                  <div>
                    <text-truncate lines="2">
                      <h2 class="title">[[post.title]]</h2>
                    </text-truncate>
                    <text-truncate lines="[[addIfNotPhone(2, 1)]]">
                      <short-markdown class="description" content="[[post.brief]]"></short-markdown>
                    </text-truncate>
                  </div>
                  <span class="date">[[getDate(post.published)]]</span>
                </div>
              </a>
            </template>
          </div>
        </div>
      </div>

      <div class="container-narrow">
        <posts-list posts="[[posts.data]]"></posts-list>
      </div>

      <footer-block></footer-block>
    `;
  }

  private heroSettings = heroSettings.blog;
  private contentLoaders = contentLoaders.blog;

  @property({ type: Object })
  posts = initialBlogState;
  @property({ type: Object })
  private viewport = initialUiState.viewport;

  @computed('posts')
  get pending() {
    return this.posts instanceof Pending;
  }

  @computed('posts')
  get failure() {
    return this.posts instanceof Failure;
  }

  override stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
    this.posts = state.blog;
  }

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);

    if (this.posts instanceof Initialized) {
      store.dispatch(fetchBlogPosts);
    }
  }

  @computed('posts')
  private get featuredPosts(): Post[] {
    if (this.posts instanceof Success) {
      return this.posts.data.slice(0, 3);
    } else {
      return [];
    }
  }

  @computed('posts')
  private get remainingPosts(): Post[] {
    if (this.posts instanceof Success) {
      return this.posts.data.slice(3);
    } else {
      return [];
    }
  }

  @computed('posts')
  private get contentLoaderVisibility(): boolean {
    return this.posts instanceof Success || this.posts instanceof Failure;
  }

  addIfNotPhone(base: number, additional: number) {
    if (this.viewport.isTabletPlus) {
      return base + additional;
    }
    return base;
  }

  private getDate(date: Date) {
    return getDate(date);
  }

  private postUrl(id: string) {
    return router.urlForName('post-page', { id });
  }
}
