import '@power-elements/lazy-image';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/markdown/short-markdown';
import '../components/text-truncate';
import { Post } from '../models/post';
import { router } from '../router';
import { getDate } from '../utils/dates';
import { ThemedElement } from './themed-element';

@customElement('posts-list')
export class PostsList extends ThemedElement {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          display: block;
        }

        .post {
          padding: 24px 0;
          display: flex;
          flex-direction: row;
          color: var(--primary-text-color);
        }

        .post:not(:last-of-type) {
          border-bottom: 1px dotted var(--divider-color);
        }

        .image {
          margin-right: 24px;
          --lazy-image-width: 64px;
          --lazy-image-height: 64px;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          border-radius: var(--border-radius);
        }

        .post-content {
          flex: 1;
          flex-basis: 1px;
        }

        .details {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }

        .title {
          line-height: 1.2;
        }

        .description {
          padding-top: 8px;
          color: var(--secondary-text-color);
        }

        .date {
          font-size: 12px;
          text-transform: uppercase;
          color: var(--secondary-text-color);
        }

        @media (min-width: 640px) {
          .image {
            --lazy-image-width: 128px;
            --lazy-image-height: 128px;
          }
        }
      `,
    ];
  }

  @property({ type: Array })
  posts: Post[] = [];

  override render() {
    return html`
      ${this.posts.map(
        (post) => html`
          <a href="${this.postUrl(post.id)}" class="post">
            <lazy-image
              class="image"
              src="${post.image}"
              alt="${post.title}"
              style="background-color: ${post.backgroundColor};"
              ?hidden="${!post.image}"
            ></lazy-image>
            <div class="post-content">
              <div class="details">
                <div>
                  <text-truncate lines="2">
                    <h2 class="title">${post.title}</h2>
                  </text-truncate>
                  <text-truncate lines="3">
                    <short-markdown class="description" content="${post.brief}"></short-markdown>
                  </text-truncate>
                </div>
                <span class="date">${getDate(post.published)}</span>
              </div>
            </div>
          </a>
        `,
      )}
    `;
  }

  private postUrl(id: string) {
    return router.urlForName('post-page', { id });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'posts-list': PostsList;
  }
}
