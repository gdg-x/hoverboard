import { afterEach, describe, expect, it } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { Ticket } from '../../models/ticket';
import type { TicketCard } from './ticket-card';
import './ticket-card';

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

const render = async (props: Partial<TicketCard> = {}) => {
  const result = await fixture<TicketCard>(html`<ticket-card></ticket-card>`);
  Object.assign(result.element, { ticket, ...props });
  await result.element.updateComplete;
  return result;
};

describe('ticket-card', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('shows the name, price, dates and info, with a link to buy', async () => {
    const { shadowRoot } = await render({
      ticket: { ...ticket, starts: 'Jan 1', ends: 'Feb 1' },
    });

    expect(shadowRoot.querySelector('.name')).toHaveTextContent('Regular Ticket');
    expect(shadowRoot.querySelector('.price')).toHaveTextContent('$100');
    expect(shadowRoot.querySelector('.dates')).toHaveTextContent('Jan 1 – Feb 1');
    expect(shadowRoot.querySelector('.info')).toHaveTextContent('General admission');
    expect(shadowRoot.querySelector('.stub hb-button')).toHaveAttribute('href', ticket.url);
    expect(shadowRoot.querySelector('.stub hb-button')).toHaveTextContent('Buy ticket');
    expect(shadowRoot.querySelector('hb-sticker')).toBeNull();
  });

  it('shows the saving against the full price', async () => {
    const { shadowRoot } = await render({ ticket: { ...ticket, price: 80 }, fullPrice: 100 });

    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('Save 20% today');
  });

  it('shows no saving on the primary ticket', async () => {
    const { shadowRoot } = await render({
      ticket: { ...ticket, primary: true, regular: false },
      fullPrice: 100,
    });

    expect(shadowRoot.querySelector('hb-sticker')).toBeNull();
  });

  it('marks a popular ticket with a sticker', async () => {
    const { shadowRoot } = await render({ ticket: { ...ticket, inDemand: true } });

    expect(shadowRoot.querySelector('.ticket')).toHaveClass('in-demand');
    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('Popular');
  });

  it('turns off buying a sold out ticket, and says so in text', async () => {
    const { shadowRoot } = await render({
      ticket: { ...ticket, soldOut: true, inDemand: true },
      fullPrice: 200,
    });

    expect(shadowRoot.querySelector('.ticket')).toHaveClass('sold-out');
    expect(shadowRoot.querySelectorAll('hb-sticker')).toHaveLength(1);
    expect(shadowRoot.querySelector('hb-sticker')).toHaveTextContent('Sold out');
    expect(shadowRoot.querySelector('.stub hb-button')).toHaveAttribute('disabled');
    expect(shadowRoot.querySelector('.stub hb-button')).toHaveTextContent('You missed it!');
  });

  it('turns off buying a ticket that is not available yet', async () => {
    const { shadowRoot } = await render({ ticket: { ...ticket, available: false } });

    expect(shadowRoot.querySelector('.stub hb-button')).toHaveAttribute('disabled');
    expect(shadowRoot.querySelector('.stub hb-button')).toHaveTextContent('Not available yet');
  });
});
