import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import '../markdown/short-markdown';
import '../ui/hb-card';
import type { Post } from '../../models/post';
import { postPath } from '../../utils/navigation';
import { getDate } from '../../utils/dates';
import { ThemedElement } from '../themed-element';

/** Blog posts as a grid of cards. With `featured`, the first card is twice as wide. */
@customElement('posts-list')
export class PostsList extends ThemedElement {
  static override styles = css`
    :host {
      display: block;
      container-type: inline-size;
    }

    ul {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
      gap: var(--hb-space-5);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: grid;
    }

    .image {
      display: block;
      inline-size: 100%;
      block-size: auto;
      aspect-ratio: 16 / 9;
      border-block-end: var(--hb-border-width) solid var(--hb-border-color);
      border-start-start-radius: calc(var(--hb-radius-l) - var(--hb-border-width));
      border-start-end-radius: calc(var(--hb-radius-l) - var(--hb-border-width));
      object-fit: cover;
    }

    .body {
      display: grid;
      gap: var(--hb-space-2);
      padding: var(--hb-space-4) var(--hb-space-5) var(--hb-space-5);
    }

    .date {
      margin: 0;
      color: var(--hb-color-on-surface-variant);
      font: 500 var(--hb-text-sm) / 1.4 var(--hb-font-mono);
    }

    .title {
      margin: 0;
      padding: 0;
      font: 700 var(--hb-text-xl) / 1.2 var(--hb-font-display);
      overflow-wrap: anywhere;
    }

    .brief {
      display: -webkit-box;
      overflow: hidden;
      color: var(--hb-color-on-surface-variant);
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      line-clamp: 3;
    }

    @container (width >= 720px) {
      .featured li:first-child {
        grid-column: span 2;
      }

      .featured li:first-child .title {
        font-size: var(--hb-text-3xl);
      }
    }
  `;

  @property({ attribute: false })
  accessor posts: Post[] = [];

  @property({ type: Boolean })
  accessor featured = false;

  /** The level of each post's title, under the section's own heading. */
  @property({ type: Number, attribute: 'heading-level' })
  accessor headingLevel: 2 | 3 = 2;

  override render() {
    return html`
      <ul class="${this.featured ? 'featured' : ''}">
        ${this.posts.map(
          (post) => html`
            <li class="post">
              <hb-card href="${postPath(post.id)}" label="${post.title}">
                ${
                  post.image
                    ? html`<img
                        class="image"
                        src="${post.image}"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style="${styleMap({ backgroundColor: post.backgroundColor })}"
                      />`
                    : nothing
                }
                <div class="body">
                  <p class="date">${getDate(post.published)}</p>
                  ${
                    this.headingLevel === 3
                      ? html`<h3 class="title">${post.title}</h3>`
                      : html`<h2 class="title">${post.title}</h2>`
                  }
                  ${
                    post.brief
                      ? html`<short-markdown
                          class="brief"
                          content="${post.brief}"
                        ></short-markdown>`
                      : nothing
                  }
                </div>
              </hb-card>
            </li>
          `,
        )}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'posts-list': PostsList;
  }
}
