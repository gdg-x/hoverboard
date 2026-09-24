import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Ticket } from '../models/ticket';
import { buyTicket, ticketsBlock } from '../utils/data';
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

    expect(shadowRoot.querySelector('content-loader')).not.toHaveAttribute('hidden');
  });

  it('renders an error message on failure', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Failure(new Error('failed'));
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Error loading tickets');
  });

  it('renders ticket details on success', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Success([ticket]);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent(ticket.name);
    expect(shadowRoot).toHaveTextContent(ticket.info);
    expect(shadowRoot.querySelector('.ticket-item')).toHaveAttribute('href', ticket.url);
    expect(shadowRoot.querySelector('md-filled-button')).toHaveTextContent(buyTicket);
  });

  it('prevents navigation for sold out tickets', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Success([{ ...ticket, soldOut: true, available: false }]);
    await element.updateComplete;

    const link = shadowRoot.querySelector<HTMLAnchorElement>('.ticket-item')!;
    expect(link).toHaveAttribute('sold-out');
    expect(shadowRoot.querySelector('md-filled-button')).toHaveTextContent(
      ticketsBlock.notAvailableYet,
    );

    const event = new MouseEvent('click', { cancelable: true, bubbles: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
