import { msg } from '@lit/localize';
import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { attendingPage } from '../../config/site';
import { ThemedComponent } from '../themed-component';
import { contentStyles, itemList } from './content';

type Mode = NonNullable<NonNullable<typeof attendingPage>['gettingThere']>[number]['mode'];

const MODES: Record<Mode, { icon: string; title: () => string }> = {
  train: { icon: 'train', title: () => msg('By train', { id: 'attending.mode.train' }) },
  plane: { icon: 'flight', title: () => msg('By plane', { id: 'attending.mode.plane' }) },
  bus: { icon: 'bus', title: () => msg('By bus', { id: 'attending.mode.bus' }) },
  tram: { icon: 'tram', title: () => msg('By tram', { id: 'attending.mode.tram' }) },
  metro: { icon: 'subway', title: () => msg('By metro', { id: 'attending.mode.metro' }) },
  car: { icon: 'car', title: () => msg('By car', { id: 'attending.mode.car' }) },
  parking: { icon: 'parking', title: () => msg('Parking', { id: 'attending.mode.parking' }) },
  bike: { icon: 'bike', title: () => msg('By bike', { id: 'attending.mode.bike' }) },
  walk: { icon: 'walk', title: () => msg('On foot', { id: 'attending.mode.walk' }) },
  // The schema requires a title for `other`.
  other: { icon: 'directions', title: () => '' },
};

/** Each way to get to the venue, with its icon and heading. Without any, it renders nothing. */
@customElement('getting-there-section')
export class GettingThereSection extends ThemedComponent {
  static override styles = contentStyles;

  override render() {
    const ways = attendingPage?.gettingThere ?? [];
    if (!ways.length) return nothing;
    return html`
      <slot name="heading"></slot>
      ${itemList(
        ways.map(({ mode, title, text }) => ({
          icon: MODES[mode].icon,
          title: title ?? MODES[mode].title(),
          text,
        })),
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'getting-there-section': GettingThereSection;
  }
}
