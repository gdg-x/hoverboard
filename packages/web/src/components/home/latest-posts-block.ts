import { Success } from '@abraham/remotedata';
import '@material/web/button/text-button.js';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../markdown/short-markdown';
import '../shared/text-truncate';
import { router } from '../../router';
import { type BlogState, selectBlogPosts } from '../../store/blog';
import { latestPostsBlock } from '../../utils/data';
import { getDate } from '../../utils/dates';
import '../shared/hoverboard-icon';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('latest-posts-block')
export class LatestPostsBlock extends ThemedElement {
  static override styles = css`
    .posts-wrapper {
      display: grid;
      grid-template-columns: 1fr;
      grid-gap: 16px;
    }

    .post {
      display: flex;
      flex: 1;
      flex-basis: 1px;
      flex-direction: column;
    }

    .image {
      overflow: hidden;
      --lazy-image-width: 100%;
      --lazy-image-height: 128px;
      --lazy-image-fit: cover;
      width: var(--lazy-image-width);
      height: var(--lazy-image-height);
      border-top-left-radius: var(--border-radius);
      border-top-right-radius: var(--border-radius);
    }

    .details {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      justify-content: space-between;
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
  `;

  private latestPostsBlock = latestPostsBlock;

  @fromStore((state) => selectBlogPosts(state))
  accessor posts!: BlogState;

  private get latestPosts() {
    if (this.posts instanceof Success) {
      return this.posts.data.slice(0, 4);
    } else {
      return [];
    }
  }

  private postUrl(id: string) {
    return router.urlForName('post-page', { id });
  }

  private getDate(date: string | Date) {
    return getDate(date);
  }

  override render() {
    return html`
      <div class="container">
        <h1 class="container-title">${this.latestPostsBlock.title}</h1>

        <div class="posts-wrapper">
          ${this.latestPosts.map(
            (post) => html`
              <a href="${this.postUrl(post.id)}" class="post card">
                <img
                  loading="lazy"
                  decoding="async"
                  class="image"
                  src="${post.image}"
                  alt="${post.title}"
                  style="background-color: ${post.backgroundColor};"
                />
                <div class="details">
                  <div>
                    <text-truncate lines="2">
                      <h3 class="title">${post.title}</h3>
                    </text-truncate>
                    <text-truncate lines="3">
                      <short-markdown class="description" content="${post.brief}"></short-markdown>
                    </text-truncate>
                  </div>
                  <div class="date">${this.getDate(post.published)}</div>
                </div>
              </a>
            `,
          )}
        </div>

        <a href="${this.latestPostsBlock.callToAction.link}">
          <md-text-button class="cta-button animated icon-right" trailing-icon>
            <span>${this.latestPostsBlock.callToAction.label}</span>
            <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
          </md-text-button>
        </a>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'latest-posts-block': LatestPostsBlock;
  }
}
