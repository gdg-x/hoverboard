import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { Ticket } from '../../models/ticket';
import type { TicketCard } from './ticket-card';
import type { TicketsBlock } from './tickets-block';
import './tickets-block';

const ticket: Ticket = {
  available: true,
  currency: '$',
  info: 'General admission',
  name: 'Regular Ticket',
  price: 100,
  regular: true,
  soldOut: false,
  url: 'https://example.com/buy',
};

describe('tickets-block', () => {
  it('defines a component', () => {
    expect(customElements.get('tickets-block')).toBeDefined();
  });

  it('shows the content loader while pending', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Pending();
    await element.updateComplete;

    expect(shadowRoot.querySelector('content-loader')).not.toBeNull();
  });

  it('renders an error message on failure', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Failure(new Error('failed'));
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Error loading tickets');
  });

  it('shows each ticket as a card, with the full price to show savings against', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    const primary = { ...ticket, name: 'Full price', price: 120, primary: true, regular: false };
    element.tickets = new Success([primary, ticket]);
    await element.updateComplete;

    const cards = [...shadowRoot.querySelectorAll<TicketCard>('.tickets ticket-card')];
    expect(cards.map((card) => card.ticket)).toEqual([primary, ticket]);
    expect(cards.map((card) => card.fullPrice)).toEqual([120, 120]);
  });

  it('has no full price without a primary ticket', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Success([ticket]);
    await element.updateComplete;

    expect(shadowRoot.querySelector<TicketCard>('ticket-card')!.fullPrice).toBeUndefined();
  });
});
