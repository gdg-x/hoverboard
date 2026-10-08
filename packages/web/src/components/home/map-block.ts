import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { initialUiState } from '../../store/ui';
import { location } from '../../config/site';
import '../../utils/media-query';
import '../shared/hoverboard-icon';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('map-block')
export class MapBlock extends ThemedElement {
  static override styles = css`
    :host {
      margin: 32px auto;
      display: block;
      position: relative;
    }

    .container {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .container.fit {
      position: absolute;
      inset: 0;
    }

    .description-card {
      margin: 0 -16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background-color: var(--default-primary-color);
      color: var(--text-primary-color);
    }

    .bottom-info {
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .directions {
      width: 48px;
      height: 48px;
      color: var(--text-primary-color);
      padding: 12px;
    }

    @media (min-width: 640px) {
      :host {
        margin: 64px auto 72px;
      }

      gmp-map {
        display: block;
        height: 640px;
      }

      .description-card {
        margin: 0;
        padding: 24px;
        max-width: 320px;
        transform: translateY(80px);
        border-radius: var(--border-radius);
      }

      .address {
        font-size: 12px;
      }
    }
  `;

  private get location() {
    return location;
  }
  private mapCenter = `${location.mapCenter.latitude},${location.mapCenter.longitude}`;
  private markerPosition = `${location.pointer.latitude},${location.pointer.longitude}`;

  @fromStore((state) => state.ui.viewport)
  private accessor viewport!: typeof initialUiState.viewport;

  override render() {
    return html`
      ${
        this.viewport.isTabletPlus
          ? html`
              <gmp-map
                id="map"
                center="${this.mapCenter}"
                zoom="${this.location.pointer.zoom}"
                disable-default-ui
                draggable="false"
              >
                <gmp-advanced-marker
                  position="${this.markerPosition}"
                  title="${this.location.name}"
                ></gmp-advanced-marker>
              </gmp-map>
            `
          : ''
      }

      <div class="container ${this.viewport.isTabletPlus ? 'fit' : ''}">
        <div class="description-card">
          <div>
            <h2>${msg('Location', { id: 'home.map-block.title' })}</h2>
            <p>${this.location.description}</p>
          </div>
          <div class="bottom-info">
            <span class="address">${this.location.address}</span>
            <a
              href="https://www.google.com/maps/dir/?api=1&amp;destination=${this.location.address}"
              target="_blank"
              rel="noopener noreferrer"
            >
              <hoverboard-icon class="directions" name="directions"></hoverboard-icon>
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'map-block': MapBlock;
  }
}
