import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { fromStore } from '../../controllers/from-store';
import { type BlogState, selectBlogPosts } from '../../store/blog';
import { band } from '../../styles/band';
import { getDate } from '../../utils/dates';
import { postPath } from '../../utils/navigation';
import '../shared/hoverboard-icon';
import { ThemedElement } from '../themed-element';
import '../ui/hb-button';
import '../ui/hb-card';

/** The three newest blog posts as cards. */
@customElement('latest-posts-block')
export class LatestPostsBlock extends ThemedElement {
  static override styles = [
    band,
    css`
      .posts {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
        gap: var(--hb-space-5);
      }

      @container (width >= 900px) {
        .posts {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      hb-card {
        block-size: 100%;
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
        padding: var(--hb-space-4) var(--hb-space-5) var(--hb-space-5);
      }

      .date {
        margin: 0;
        color: var(--hb-color-on-surface-variant);
        font: 500 var(--hb-text-sm) / 1.4 var(--hb-font-mono);
      }

      .title {
        margin: var(--hb-space-2) 0 0;
        padding: 0;
        font: 700 var(--hb-text-xl) / 1.2 var(--hb-font-display);
        overflow-wrap: anywhere;
      }
    `,
  ];

  @fromStore((state) => selectBlogPosts(state))
  accessor posts!: BlogState;

  private get latestPosts() {
    return this.posts instanceof Success ? this.posts.data.slice(0, 3) : [];
  }

  override render() {
    return html`
      <div class="inner">
        <div class="band-header">
          <h2 class="band-title">
            ${msg('The latest news', { id: 'home.latest-posts-block.title' })}
          </h2>
          <hb-button variant="outlined" class="cta-button" href="/blog" trailing-icon>
            ${msg('View all stories', { id: 'home.latest-posts-block.cta' })}
            <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
          </hb-button>
        </div>

        <ul class="posts plain">
          ${this.latestPosts.map(
            (post) => html`
              <li>
                <hb-card href="${postPath(post.id)}" label="${post.title}">
                  <img
                    class="image"
                    src="${post.image}"
                    alt=""
                    loading="lazy"
                    style="${styleMap({ backgroundColor: post.backgroundColor })}"
                  />
                  <div class="body">
                    <p class="date">${getDate(post.published)}</p>
                    <h3 class="title">${post.title}</h3>
                  </div>
                </hb-card>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'latest-posts-block': LatestPostsBlock;
  }
}
