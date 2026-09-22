import '@polymer/google-map';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { initialUiState } from '../store/ui/state';
import { CONFIG, getConfig } from '../utils/config';
import { location, mapBlock } from '../utils/data';
import './hoverboard-icon';
import { ThemedElement } from './themed-element';

@customElement('map-block')
export class MapBlock extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          margin: 32px auto;
          display: block;
          position: relative;
        }

        .description-card {
          margin: 0 -16px;
          padding: 16px;
          background-color: var(--default-primary-color);
          color: var(--text-primary-color);
        }

        .bottom-info {
          margin-top: 24px;
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

          google-map {
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
      `,
    ];
  }

  private location = location;
  private mapBlock = mapBlock;
  private googleMapApiKey = getConfig(CONFIG.GOOGLE_MAPS_API_KEY);

  @property({ type: Object })
  private viewport = initialUiState.viewport;

  @property({ type: Object })
  private option = {
    disableDefaultUI: true,
    disableDoubleClickZoom: true,
    scrollwheel: false,
    draggable: false,
    styles: [
      {
        stylers: [{ lightness: 40 }, { visibility: 'on' }, { gamma: 0.9 }, { weight: 0.4 }],
      },
      {
        elementType: 'labels',
        stylers: [{ visibility: 'on' }],
      },
      {
        featureType: 'water',
        stylers: [{ color: '#5dc7ff' }],
      },
      {
        featureType: 'road',
        stylers: [{ visibility: 'off' }],
      },
    ],
  };

  override stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
  }

  override render() {
    return html`
      ${
        this.viewport.isTabletPlus
          ? html`
              <google-map
                id="map"
                latitude="${this.location.mapCenter.latitude}"
                longitude="${this.location.mapCenter.longitude}"
                api-key="${this.googleMapApiKey}"
                zoom="${this.location.pointer.zoom}"
                disable-default-ui
                draggable="false"
              >
                <google-map-marker
                  latitude="${this.location.pointer.latitude}"
                  longitude="${this.location.pointer.longitude}"
                  title="${this.location.name}"
                  icon="images/map-marker.svg"
                ></google-map-marker>
              </google-map>
            `
          : ''
      }

      <div class="container" layout vertical end-justified ?fit="${this.viewport.isTabletPlus}">
        <div class="description-card" layout vertical justified>
          <div>
            <h2>${this.mapBlock.title}</h2>
            <p>${this.location.description}</p>
          </div>
          <div class="bottom-info" layout horizontal justified center>
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
