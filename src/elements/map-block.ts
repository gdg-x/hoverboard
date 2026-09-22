import { customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import '../components/hoverboard-icon';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { initialUiState } from '../store/ui/state';
import { location, mapBlock } from '../utils/data';
import './shared-styles';

@customElement('map-block')
export class MapBlock extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
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
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--text-primary-color);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: opacity 0.2s ease;
        }

        .directions:hover {
          opacity: 0.8;
        }

        gmp-map {
          display: block;
          height: 640px;
          width: 100%;
        }

        @media (min-width: 640px) {
          :host {
            margin: 64px auto 72px;
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
      </style>

      <template is="dom-if" if="[[viewport.isTabletPlus]]">
        <gmp-map
          id="map"
          center="[[mapCenter]]"
          zoom="[[location.pointer.zoom]]"
          disable-default-ui
          draggable="false"
          style="height: 640px;"
        >
          <gmp-advanced-marker
            position="[[markerPosition]]"
            title="[[location.name]]"
          ></gmp-advanced-marker>
        </gmp-map>
      </template>

      <div class="container" layout vertical end-justified fit$="[[viewport.isTabletPlus]]">
        <div class="description-card" layout vertical justified>
          <div>
            <h2>[[mapBlock.title]]</h2>
            <p>[[location.description]]</p>
          </div>
          <div class="bottom-info" layout horizontal justified center>
            <span class="address">[[location.address]]</span>
            <a
              href="https://www.google.com/maps/dir/?api=1&amp;destination=[[location.address]]"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button class="directions" type="button" aria-label="Get directions">
                <hoverboard-icon name="directions"></hoverboard-icon>
              </button>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private location = location;
  private mapBlock = mapBlock;
  private mapCenter = `${location.mapCenter.latitude},${location.mapCenter.longitude}`;
  private markerPosition = `${location.pointer.latitude},${location.pointer.longitude}`;

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
}
