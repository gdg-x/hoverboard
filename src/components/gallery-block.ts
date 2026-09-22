import '@material/web/button/outlined-button.js';
import '@power-elements/lazy-image';
import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Photo } from '../models/photo';
import { RootState, store } from '../store';
import { fetchGallery } from '../store/gallery/actions';
import { initialGalleryState } from '../store/gallery/state';
import { ReduxMixin } from '../store/mixin';
import { galleryBlock } from '../utils/data';
import { ThemedElement } from './themed-element';

@customElement('gallery-block')
export class GalleryBlock extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        .photos-grid {
          margin: 64px auto;
          display: grid;
          width: 100%;
          min-height: 400px;
          height: calc(100vh - 40px);
          max-height: 750px;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(5, 1fr);
          grid-gap: 2px;
        }

        .grid-item {
          --lazy-image-fit: cover;
          background-color: var(--secondary-background-color);
        }

        .grid-item:first-child {
          grid-area: 1 / 1 / 3 / 4;
        }

        .grid-item:nth-child(2) {
          grid-area: 3 / 1 / 5 / 3;
        }

        .grid-item:nth-child(3) {
          grid-area: 3 / 3 / 3 / 3;
        }

        .grid-item:nth-child(4) {
          grid-area: 4 / 3 / 4 / 3;
        }

        .grid-item:nth-child(5) {
          grid-area: 5 / 1 / 5 / 1;
        }

        .grid-item:nth-child(6),
        .grid-item:nth-child(7),
        .grid-item:nth-child(8) {
          display: none;
        }

        .gallery-info {
          padding: 16px;
          background-color: var(--default-primary-color);
          color: var(--text-primary-color);
          z-index: 1;
          grid-area: 5 / 2 / 5 / 4;
        }

        md-outlined-button {
          margin-top: 16px;
          --md-outlined-button-label-text-color: var(--text-primary-color);
          --md-outlined-button-hover-label-text-color: var(--text-primary-color);
          --md-outlined-button-outline-color: var(--text-primary-color);
        }

        @media (min-width: 640px) {
          .photos-grid {
            height: calc(100vh - 64px);
            grid-template-columns: repeat(5, 1fr);
            grid-template-rows: repeat(3, 1fr);
          }

          .grid-item:first-child {
            grid-area: 1 / 1 / 1 / 3;
          }

          .grid-item:nth-child(2) {
            grid-area: 1 / 3 / 2 / 5;
          }

          .grid-item:nth-child(3) {
            grid-area: 1 / 5 / 3 / 5;
          }

          .grid-item:nth-child(4) {
            grid-area: 2 / 1 / 2 / 1;
          }

          .grid-item:nth-child(5) {
            grid-area: 2 / 2 / 2 / 2;
          }

          .grid-item:nth-child(6) {
            grid-area: 3 / 1 / 3 / 3;
            display: block;
          }

          .grid-item:nth-child(7) {
            grid-area: 3 / 3 / 3 / 3;
            display: block;
          }

          .grid-item:nth-child(8) {
            grid-area: 3 / 4 / 3 / 6;
            display: block;
          }

          .gallery-info {
            padding: 24px;
            grid-area: 2 / 3 / 2 / 5;
          }
        }
      `,
    ];
  }

  @property({ type: Object })
  gallery = initialGalleryState;

  override stateChanged(state: RootState) {
    this.gallery = state.gallery;
  }

  override connectedCallback() {
    super.connectedCallback();

    if (this.gallery instanceof Initialized) {
      store.dispatch(fetchGallery);
    }
  }

  override render() {
    return html`
      <div class="photos-grid">
        ${this.pending ? html`<p>Loading...</p>` : ''}
        ${this.failure ? html`<p>Error loading gallery.</p>` : ''}
        ${this.photos.map(
          (photo) =>
            html`<lazy-image
              class="grid-item"
              src="${photo.url}"
              alt="gallery photo"
            ></lazy-image>`,
        )}
        ${
          this.success
            ? html`
                <div class="gallery-info" layout vertical justified>
                  <div>
                    <h2>${galleryBlock.title}</h2>
                    <p>${galleryBlock.description}</p>
                  </div>
                  <a
                    href="${galleryBlock.callToAction.link}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <md-outlined-button>${galleryBlock.callToAction.label}</md-outlined-button>
                  </a>
                </div>
              `
            : ''
        }
      </div>
    `;
  }

  private get pending() {
    return this.gallery instanceof Pending;
  }

  private get failure() {
    return this.gallery instanceof Failure;
  }

  private get success() {
    return this.gallery instanceof Success;
  }

  private get photos(): Photo[] {
    if (this.gallery instanceof Success) {
      return this.gallery.data;
    }
    return [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gallery-block': GalleryBlock;
  }
}
