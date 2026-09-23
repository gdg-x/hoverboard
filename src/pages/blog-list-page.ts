import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import '@material/web/progress/linear-progress.js';
import '@power-elements/lazy-image';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../components/content-loader';
import '../components/footer-block';
import '../components/hero/simple-hero';
import '../components/markdown/short-markdown';
import '../components/posts-list';
import '../components/text-truncate';
import { ThemedElement } from '../components/themed-element';
import { Post } from '../models/post';
import { router } from '../router';
import { RootState } from '../store';
import { BlogState, selectBlogPosts } from '../store/blog';
import { ReduxMixin } from '../store/mixin';
import { initialUiState } from '../store/ui';
import { contentLoaders, heroSettings } from '../utils/data';
import { getDate } from '../utils/dates';
import { updateMetadata } from '../utils/metadata';

@customElement('blog-list-page')
export class BlogListPage extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
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

        .progress {
          width: 100%;
          --md-linear-progress-active-indicator-color: var(--default-primary-color);
          --md-linear-progress-track-color: var(--default-primary-color);
        }

        @media (min-width: 640px) {
          .featured-posts-wrapper {
            grid-template-columns: repeat(3, 1fr);
          }

          .featured-post {
            height: 256px;
          }
        }
      `,
    ];
  }

  private heroSettings = heroSettings.blog;
  private contentLoaders = contentLoaders.blog;

  @property({ type: Object })
  posts: BlogState = new Initialized();
  @state()
  private viewport = initialUiState.viewport;

  get pending() {
    return this.posts instanceof Pending;
  }

  get failure() {
    return this.posts instanceof Failure;
  }

  private get featuredPosts(): Post[] {
    return this.posts instanceof Success ? this.posts.data.slice(0, 3) : [];
  }

  private get contentLoaderVisibility(): boolean {
    return this.posts instanceof Success || this.posts instanceof Failure;
  }

  override stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
    this.posts = selectBlogPosts(state);
  }

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);
  }

  addIfNotPhone(base: number, additional: number) {
    return this.viewport.isTabletPlus ? base + additional : base;
  }

  private postUrl(id: string) {
    return router.urlForName('post-page', { id });
  }

  override render() {
    const posts = this.posts instanceof Success ? this.posts.data : [];

    return html`
      <simple-hero page="blog"></simple-hero>

      <md-linear-progress
        class="progress"
        indeterminate
        ?hidden=${this.contentLoaderVisibility}
      ></md-linear-progress>

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
            .itemsCount=${this.contentLoaders.itemsCount}
            ?hidden=${this.contentLoaderVisibility}
          ></content-loader>

          <div class="featured-posts-wrapper">
            ${this.failure ? html`<p>Error loading posts.</p>` : ''}
            ${this.featuredPosts.map(
              (post) => html`
                <a
                  href=${this.postUrl(post.id)}
                  class="featured-post"
                  ?flex=${this.viewport.isTabletPlus}
                  relative
                >
                  <lazy-image
                    class="image"
                    src=${post.image}
                    alt=${post.title}
                    style="background-color: ${post.backgroundColor};"
                  ></lazy-image>

                  <div class="image-overlay" fit></div>
                  <div class="details" layout vertical justified>
                    <div>
                      <text-truncate lines="2">
                        <h2 class="title">${post.title}</h2>
                      </text-truncate>
                      <text-truncate lines=${this.addIfNotPhone(2, 1)}>
                        <short-markdown class="description" content=${post.brief}></short-markdown>
                      </text-truncate>
                    </div>
                    <span class="date">${getDate(post.published)}</span>
                  </div>
                </a>
              `,
            )}
          </div>
        </div>
      </div>

      <div class="container-narrow">
        <posts-list .posts=${posts}></posts-list>
      </div>

      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'blog-list-page': BlogListPage;
  }
}
