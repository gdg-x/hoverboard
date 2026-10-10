import { msg } from '@lit/localize';
import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { attendingPage } from '../../config/site';
import { ThemedComponent } from '../themed-component';
import { contentStyles, itemList } from './content';

type Topic = NonNullable<NonNullable<typeof attendingPage>['atVenue']>[number]['topic'];

const TOPICS: Record<Topic, { icon: string; title: () => string }> = {
  wifi: { icon: 'wifi', title: () => msg('Wi-Fi', { id: 'attending.topic.wifi' }) },
  food: { icon: 'lunch', title: () => msg('Food and drink', { id: 'attending.topic.food' }) },
  cloakroom: {
    icon: 'checkroom',
    title: () => msg('Cloakroom', { id: 'attending.topic.cloakroom' }),
  },
  firstAid: {
    icon: 'first-aid',
    title: () => msg('First aid', { id: 'attending.topic.first-aid' }),
  },
  quietRoom: {
    icon: 'quiet-room',
    title: () => msg('Quiet room', { id: 'attending.topic.quiet-room' }),
  },
  lostAndFound: {
    icon: 'search',
    title: () => msg('Lost and found', { id: 'attending.topic.lost-and-found' }),
  },
  childcare: {
    icon: 'child-care',
    title: () => msg('Childcare', { id: 'attending.topic.childcare' }),
  },
  // The schema requires a title for `other`.
  other: { icon: 'help', title: () => '' },
};

/** Practical details at the venue, each with its icon and heading. Without any, it renders nothing. */
@customElement('at-venue-section')
export class AtVenueSection extends ThemedComponent {
  static override styles = contentStyles;

  override render() {
    const topics = attendingPage?.atVenue ?? [];
    if (!topics.length) return nothing;
    return html`
      <slot name="heading"></slot>
      ${itemList(
        topics.map(({ topic, title, text }) => ({
          icon: TOPICS[topic].icon,
          title: title ?? TOPICS[topic].title(),
          text,
        })),
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'at-venue-section': AtVenueSection;
  }
}
