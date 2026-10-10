import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Ticket } from '../../models/ticket';
import { getLocale } from '../../utils/localization';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';
import '../ui/hb-sticker';

/**
 * A ticket-shaped card: the name, price, dates and info, stickers when it is sold out, popular or
 * cheaper than full price, and a tear-off stub with the link to buy.
 */
@customElement('ticket-card')
export class TicketCard extends ThemedComponent {
  static override styles = css`
    :host {
      display: block;
      block-size: 100%;
    }

    .ticket {
      position: relative;
      display: flex;
      flex-direction: column;
      block-size: 100%;
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-l);
      background-color: var(--hb-panel-background);
      backdrop-filter: var(--hb-backdrop-filter);
      color: var(--hb-color-on-surface);
      box-shadow: var(--hb-shadow-card);
    }

    .ticket.in-demand {
      background-color: var(--hb-color-primary-container);
      color: var(--hb-color-on-primary-container);
    }

    .stickers {
      position: absolute;
      inset-block-start: calc(var(--hb-space-3) * -1);
      inset-inline-end: var(--hb-space-4);
      display: flex;
      gap: var(--hb-space-1);
    }

    .main {
      flex: 1;
      padding: var(--hb-space-6) var(--hb-space-5) var(--hb-space-5);
    }

    .name {
      margin: 0;
      padding: 0;
      font: 700 var(--hb-text-lg) / 1.2 var(--hb-font-body);
    }

    .price {
      margin: var(--hb-space-3) 0 0;
      font: 800 var(--hb-text-4xl) / 1 var(--hb-font-display);
      overflow-wrap: anywhere;
    }

    .sold-out .price {
      text-decoration: line-through;
    }

    .dates {
      margin: var(--hb-space-3) 0 0;
      font: 500 var(--hb-text-sm) / 1.4 var(--hb-font-mono);
    }

    .info {
      margin: var(--hb-space-2) 0 0;
      font-size: var(--hb-text-sm);
    }

    /* The tear-off line, with a notch at each end in the band's color. */
    .stub {
      position: relative;
      padding: var(--hb-space-4) var(--hb-space-5) var(--hb-space-5);
      border-block-start: var(--hb-border-width) dashed currentColor;
    }

    .stub::before,
    .stub::after {
      content: '';
      position: absolute;
      inset-block-start: 0;
      inline-size: 24px;
      block-size: 24px;
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: 50%;
      background-color: var(--hb-band-background, var(--hb-color-surface));
      translate: 0 -50%;
    }

    /* Half circles that cover the card's edge. */
    .stub::before {
      inset-inline-start: -14px;
      clip-path: inset(0 0 0 50%);
    }

    .stub::after {
      inset-inline-end: -14px;
      clip-path: inset(0 50% 0 0);
    }

    .stub hb-button {
      inline-size: 100%;
    }

    @media (forced-colors: active) {
      .ticket {
        border-color: CanvasText;
      }
    }
  `;

  @property({ attribute: false })
  accessor ticket: Ticket | undefined;
  /** The primary ticket's price, which a regular ticket shows its saving against. */
  @property({ type: Number })
  accessor fullPrice: number | undefined;

  override render() {
    const ticket = this.ticket;
    if (!ticket) return nothing;
    const discount = this.discount(ticket);
    const classes = [ticket.soldOut && 'sold-out', ticket.inDemand && 'in-demand'].filter(Boolean);
    return html`
      <article class="ticket ${classes.join(' ')}">
        <div class="stickers">
          ${
            ticket.soldOut
              ? html`<hb-sticker accent="2" tilt="4"
                  >${msg('Sold out', { id: 'home.tickets-block.sold-out-sticker' })}</hb-sticker
                >`
              : nothing
          }
          ${
            !ticket.soldOut && ticket.inDemand
              ? html`<hb-sticker tilt="4"
                  >${msg('Popular', { id: 'home.tickets-block.in-demand' })}</hb-sticker
                >`
              : nothing
          }
          ${discount ? html`<hb-sticker accent="4" tilt="-3">${discount}</hb-sticker>` : nothing}
        </div>
        <div class="main">
          <h3 class="name">${ticket.name}</h3>
          <p class="price">${ticket.currency}${ticket.price}</p>
          ${ticket.starts ? html`<p class="dates">${ticket.starts} – ${ticket.ends}</p>` : nothing}
          <p class="info">${ticket.info}</p>
        </div>
        <div class="stub">
          <hb-button
            variant="cta"
            href="${ticket.url}"
            target="_blank"
            ?disabled="${ticket.soldOut || !ticket.available}"
          >
            ${this.buttonLabel(ticket)}
          </hb-button>
        </div>
      </article>
    `;
  }

  private buttonLabel(ticket: Ticket) {
    if (ticket.soldOut) {
      return msg('You missed it!', {
        id: 'home.tickets-block.sold-out',
        desc: 'Shown on a sold-out ticket.',
      });
    }
    return ticket.available
      ? msg('Buy ticket', { id: 'common.buy-ticket' })
      : msg('Not available yet', { id: 'home.tickets-block.not-available' });
  }

  private discount(ticket: Ticket) {
    const fullPrice = this.fullPrice;
    if (!ticket.regular || ticket.primary || ticket.soldOut || !fullPrice) {
      return '';
    }
    const discount = new Intl.NumberFormat(getLocale(), { style: 'percent' }).format(
      Math.round(100 - (ticket.price * 100) / fullPrice) / 100,
    );
    return msg(str`Save ${discount} today`, { id: 'home.tickets-block.save' });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ticket-card': TicketCard;
  }
}
