import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { galleryBlock } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import type { Photo } from '../../models/photo';
import { type GalleryState, selectGallery } from '../../store/gallery';
import { band } from '../../styles/band';
import '../shared/hoverboard-icon';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';

/** Up to seven photos in a bento grid, and a link to the full gallery. */
@customElement('gallery-block')
export class GalleryBlock extends ThemedComponent {
  static override styles = [
    band,
    css`
      .photos {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: 9rem;
        grid-auto-flow: dense;
        gap: var(--hb-space-3);
      }

      .photos li:first-child {
        grid-row: span 2;
        grid-column: span 2;
      }

      .photo {
        display: block;
        inline-size: 100%;
        block-size: 100%;
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-m);
        background-color: var(--hb-color-surface-container);
        object-fit: cover;
      }

      @container (width >= 720px) {
        .photos {
          grid-template-columns: repeat(4, minmax(0, 1fr));
          grid-auto-rows: 11rem;
          gap: var(--hb-space-4);
        }

        .photos li:nth-child(4) {
          grid-row: span 2;
        }

        .photos li:nth-child(6) {
          grid-column: span 2;
        }
      }
    `,
  ];

  @fromStore((state) => selectGallery(state))
  accessor gallery!: GalleryState;

  override render() {
    return html`
      <div class="inner">
        <div class="band-header">
          <div>
            <h2 class="band-title">${galleryBlock.title}</h2>
            <p class="band-lede">${galleryBlock.description}</p>
          </div>
          <hb-button
            variant="outlined"
            href="${galleryBlock.callToAction.link}"
            target="_blank"
            trailing-icon
          >
            ${msg('See all photos', { id: 'home.gallery-block.cta' })}
            <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
          </hb-button>
        </div>
        ${
          this.gallery instanceof Pending
            ? html`<p>${msg('Loading...', { id: 'common.loading' })}</p>`
            : nothing
        }
        ${
          this.gallery instanceof Failure
            ? html`<p>${msg('Error loading gallery.', { id: 'home.gallery-block.error' })}</p>`
            : nothing
        }
        <ul class="photos plain">
          ${this.photos.map(
            (photo) => html`
              <li>
                <img
                  class="photo"
                  src="${photo.url}"
                  alt="${msg('Gallery photo', { id: 'home.gallery-block.photo-alt' })}"
                  loading="lazy"
                />
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }

  private get photos(): Photo[] {
    return this.gallery instanceof Success ? this.gallery.data.slice(0, 7) : [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gallery-block': GalleryBlock;
  }
}
