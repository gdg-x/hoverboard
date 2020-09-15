import '@polymer/google-map';
import '@polymer/paper-icon-button';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
import { State } from '../redux/store';
import './hoverboard-icons';
import './shared-styles';

class MapBlock extends ReduxMixin(PolymerElement) {
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
          --paper-icon-button: {
            width: 48px;
            height: 48px;
            color: var(--text-primary-color);
          }
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
      </style>

      <template is="dom-if" if="[[viewport.isTabletPlus]]">
        <google-map
          id="map"
          latitude="{$ location.mapCenter.latitude $}"
          longitude="{$ location.mapCenter.longitude $}"
          api-key="{$ googleMapApiKey $}"
          zoom="{$ location.pointer.zoom $}"
          disable-default-ui
          draggable="false"
          additional-map-options="[[options]]"
        >
          <google-map-marker
            latitude="{$ location.pointer.latitude $}"
            longitude="{$ location.pointer.longitude $}"
            title="{$ location.name $}"
            icon="images/map-marker.svg"
          ></google-map-marker>
        </google-map>
      </template>

      <div class="container" layout vertical end-justified fit$="[[viewport.isTabletPlus]]">
        <div class="description-card" layout vertical justified>
          <div>
            <h2>{$ mapBlock.title $}</h2>
            <p>{$ location.description $}</p>
          </div>
          <div class="bottom-info" layout horizontal justified center>
            <span class="address">{$ location.address $}</span>
            <a
              href="https://www.google.com/maps/dir/?api=1&amp;destination={$ location.address $}"
              target="_blank"
              rel="noopener noreferrer"
            >
              <paper-icon-button
                class="directions"
                icon="hoverboard:directions"
              ></paper-icon-button>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  static get is() {
    return 'map-block';
  }

  static get properties() {
    return {
      viewport: {
        type: Object,
      },
      options: {
        type: Object,
        value: {
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
        },
      },
    };
  }

  stateChanged(state: State) {
    return this.setProperties({
      viewport: state.ui.viewport,
    });
  }
}

window.customElements.define(MapBlock.is, MapBlock);
