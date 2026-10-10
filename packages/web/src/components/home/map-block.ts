import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { location, mapsScriptUrl } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import { availableOnlineMessage, selectOnline } from '../../store/sync';
import { band } from '../../styles/band';
import { currentColorScheme } from '../../utils/color-scheme';
import '../shared/hoverboard-icon';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';

let mapsScript: Promise<void> | undefined;

/** Loads the Google Maps script once, and waits for its map element. */
const loadMapsScript = (src: string) =>
  (mapsScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => {
      mapsScript = undefined;
      script.remove();
      reject(new Error('Google Maps did not load'));
    });
    document.head.append(script);
  }).then(() => customElements.whenDefined('gmp-map').then(() => undefined)));

/** Links to directions in map apps for the venue, by its address or its pin. */
export const directionLinks = ({
  address,
  pointer,
}: {
  address: string;
  pointer: { latitude: number; longitude: number };
}) => [
  {
    name: 'Google Maps',
    url: `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination: address })}`,
  },
  {
    name: 'Apple Maps',
    url: `https://maps.apple.com/?${new URLSearchParams({ daddr: address })}`,
  },
  {
    name: 'OpenStreetMap',
    url: `https://www.openstreetmap.org/?${new URLSearchParams({
      mlat: String(pointer.latitude),
      mlon: String(pointer.longitude),
    })}#map=17/${pointer.latitude}/${pointer.longitude}`,
  },
];

/**
 * The venue: name, address, directions and, with a Maps key, a map that loads only when asked, so
 * pages do not load Google Maps up front.
 */
@customElement('map-block')
export class MapBlock extends ThemedComponent {
  static override styles = [
    band,
    css`
      .layout {
        display: grid;
        gap: var(--hb-space-7);
      }

      .venue {
        margin: var(--hb-space-5) 0 0;
        font: 700 var(--hb-text-2xl) / 1.15 var(--hb-font-display);
        overflow-wrap: anywhere;
      }

      address {
        margin-block-start: var(--hb-space-2);
        font: 500 var(--hb-text-md) / 1.5 var(--hb-font-mono);
        font-style: normal;
      }

      .description {
        max-inline-size: var(--hb-prose-max);
        margin: var(--hb-space-4) 0 0;
      }

      .directions-title {
        margin: var(--hb-space-6) 0 var(--hb-space-3);
        padding: 0;
        font: 700 var(--hb-text-md) / 1.3 var(--hb-font-body);
      }

      .directions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--hb-space-2);
      }

      .map {
        display: grid;
        min-block-size: 20rem;
        overflow: hidden;
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-l);
        background-color: var(--hb-color-surface-container);
        color: var(--hb-color-on-surface);
        box-shadow: var(--hb-shadow-card);
      }

      .placeholder {
        display: grid;
        place-content: center;
        justify-items: center;
        gap: var(--hb-space-3);
        padding: var(--hb-space-6);
        text-align: center;
      }

      .placeholder > hoverboard-icon {
        inline-size: 48px;
        block-size: 48px;
      }

      .placeholder p {
        max-inline-size: 32ch;
        margin: 0;
      }

      .error {
        color: var(--hb-color-error);
        font-weight: 600;
      }

      gmp-map {
        display: block;
        min-block-size: 20rem;
      }

      @container (width >= 800px) {
        .layout {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
        }

        .map,
        gmp-map {
          min-block-size: 28rem;
        }
      }
    `,
  ];

  @state()
  private accessor mapState: 'idle' | 'loading' | 'shown' | 'failed' = 'idle';
  @fromStore(selectOnline)
  private accessor online!: boolean;

  override render() {
    const { latitude, longitude } = location.pointer;
    return html`
      <div class="inner layout">
        <div>
          <h2 class="band-title">${msg('Location', { id: 'home.map-block.title' })}</h2>
          <p class="venue">${location.name}</p>
          <address>${location.address}</address>
          <p class="description">${location.description}</p>
          <h3 class="directions-title" id="directions">
            ${msg('Directions', { id: 'home.map-block.directions' })}
          </h3>
          <ul class="directions plain" aria-labelledby="directions">
            ${directionLinks(location).map(
              ({ name, url }) => html`
                <li>
                  <hb-button variant="outlined" href="${url}" target="_blank">
                    <hoverboard-icon slot="icon" name="directions"></hoverboard-icon>
                    ${name}
                  </hb-button>
                </li>
              `,
            )}
          </ul>
        </div>
        ${
          mapsScriptUrl
            ? html`<div class="map">
                ${
                  this.mapState === 'shown'
                    ? html`<gmp-map
                        center="${location.mapCenter.latitude},${location.mapCenter.longitude}"
                        zoom="${location.pointer.zoom}"
                        color-scheme="${currentColorScheme() === 'dark' ? 'DARK' : 'LIGHT'}"
                        disable-default-ui
                      >
                        <gmp-advanced-marker
                          position="${latitude},${longitude}"
                          title="${location.name}"
                        ></gmp-advanced-marker>
                      </gmp-map>`
                    : this.renderPlaceholder()
                }
              </div>`
            : nothing
        }
      </div>
    `;
  }

  private renderPlaceholder() {
    const loading = this.mapState === 'loading';
    return html`
      <div class="placeholder">
        <hoverboard-icon name="location"></hoverboard-icon>
        <p>
          ${
            this.online
              ? msg('The map loads from Google Maps.', { id: 'home.map-block.map-note' })
              : availableOnlineMessage()
          }
        </p>
        <hb-button class="show-map" ?disabled="${loading || !this.online}" @click="${this.showMap}">
          ${
            loading
              ? msg('Loading map…', { id: 'home.map-block.loading' })
              : msg('Show map', { id: 'home.map-block.show-map' })
          }
        </hb-button>
        ${
          this.mapState === 'failed'
            ? html`<p class="error" role="alert">
                ${msg('The map did not load. Try again.', { id: 'home.map-block.error' })}
              </p>`
            : nothing
        }
      </div>
    `;
  }

  private readonly showMap = async () => {
    if (!mapsScriptUrl) return;
    this.mapState = 'loading';
    try {
      await loadMapsScript(mapsScriptUrl);
      this.mapState = 'shown';
    } catch {
      this.mapState = 'failed';
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'map-block': MapBlock;
  }
}
