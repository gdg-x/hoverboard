import { msg } from '@lit/localize';
import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { location } from '../../config/site';
import { band } from '../../styles/band';
import '../attending/venue-section';
import { ThemedComponent } from '../themed-component';

/** The home page's band with the venue, its directions and its map. */
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
      </venue-section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'map-block': MapBlock;
  }
}
