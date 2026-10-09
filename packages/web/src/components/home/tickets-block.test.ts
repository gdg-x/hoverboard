import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { Ticket } from '../../models/ticket';
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

  it('renders ticket details on success', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Success([ticket]);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent(ticket.name);
    expect(shadowRoot).toHaveTextContent(ticket.info);
    expect(shadowRoot.querySelector('.price')).toHaveTextContent('$100');
    expect(shadowRoot.querySelector('.stub hb-button')).toHaveAttribute('href', ticket.url);
    expect(shadowRoot.querySelector('.stub hb-button')).toHaveTextContent('Buy ticket');
  });

  it('shows the discount against the primary ticket', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Success([
      { ...ticket, name: 'Full price', primary: true, regular: false },
      { ...ticket, price: 80 },
    ]);
    await element.updateComplete;

    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('Save 20% today');
  });

  it('marks a popular ticket with a sticker', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Success([{ ...ticket, inDemand: true }]);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.ticket')).toHaveClass('in-demand');
    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('Popular');
  });

  it('turns off buying a sold out ticket, and says so in text', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Success([{ ...ticket, soldOut: true, inDemand: true }]);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.ticket')).toHaveClass('sold-out');
    expect(shadowRoot.querySelectorAll('hb-sticker')).toHaveLength(1);
    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('Sold out');
    expect(shadowRoot.querySelector('.stub hb-button')).toHaveAttribute('disabled');
    expect(shadowRoot.querySelector('.stub hb-button')).toHaveTextContent('You missed it!');
  });

  it('turns off buying a ticket that is not available yet', async () => {
    const { element, shadowRoot } = await fixture<TicketsBlock>(
      html`<tickets-block></tickets-block>`,
    );
    element.tickets = new Success([{ ...ticket, available: false }]);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.stub hb-button')).toHaveAttribute('disabled');
    expect(shadowRoot.querySelector('.stub hb-button')).toHaveTextContent('Not available yet');
  });
});
