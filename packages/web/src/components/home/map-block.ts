import { msg } from '@lit/localize';
import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { location } from '../../config/site';
import { band } from '../../styles/band';
import '../attending/venue-section';
import '../shared/hoverboard-icon';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';

/** The home page's band with the venue, its directions, its map and a link to the attending page. */
@customElement('map-block')
export class MapBlock extends ThemedComponent {
  static override styles = band;

  override render() {
    if (!location) return nothing;
    return html`
      <venue-section class="inner">
        <h2 slot="heading" class="band-title">
          ${msg('Location', { id: 'home.map-block.title' })}
        </h2>
        ${
          __HB_FEATURES__.attending
            ? html`<hb-button class="attending" variant="text" href="/attending" trailing-icon>
                ${msg('More about attending', { id: 'home.map-block.attending' })}
                <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
              </hb-button>`
            : nothing
        }
      </venue-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'map-block': MapBlock;
  }
}
