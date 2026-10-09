import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { contentLoaders, ticketsBlock } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import type { Ticket } from '../../models/ticket';
import { type TicketsState, selectTickets } from '../../store/tickets';
import { band } from '../../styles/band';
import { getLocale } from '../../utils/localization';
import '../shared/content-loader';
import { ThemedElement } from '../themed-element';
import '../ui/hb-button';
import '../ui/hb-sticker';

/** Ticket-shaped cards with the price, a status sticker and a link to buy. */
@customElement('tickets-block')
export class TicketsBlock extends ThemedElement {
  static override styles = [
    band,
    css`
      .tickets,
      .placeholder {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
        gap: var(--hb-space-6) var(--hb-space-5);
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

      .details {
        max-inline-size: var(--hb-prose-max);
        margin: var(--hb-space-7) 0 0;
        font-size: var(--hb-text-sm);
      }

      @media (forced-colors: active) {
        .ticket {
          border-color: CanvasText;
        }
      }
    `,
  ];

  @fromStore((state) => selectTickets(state))
  accessor tickets!: TicketsState;

  override render() {
    return html`
      <div class="inner">
        <div class="band-header">
          <h2 class="band-title">${msg('Tickets', { id: 'home.tickets-block.title' })}</h2>
        </div>
        ${
          this.tickets instanceof Pending
            ? html`<content-loader
                class="placeholder"
                card-padding="24px"
                card-height="216px"
                border-radius="var(--hb-radius-l)"
                title-top-position="32px"
                title-height="42px"
                title-width="70%"
                load-from="-70%"
                load-to="130%"
                animation-time="1s"
                items-count="${contentLoaders.tickets.itemsCount}"
              ></content-loader>`
            : nothing
        }
        ${
          this.tickets instanceof Failure
            ? html`<p>${msg('Error loading tickets', { id: 'home.tickets-block.error' })}</p>`
            : nothing
        }
        <ul class="tickets plain">
          ${this.ticketsList.map((ticket) => this.renderTicket(ticket))}
        </ul>
        <p class="details">${ticketsBlock.ticketsDetails}</p>
      </div>
    `;
  }

  private renderTicket(ticket: Ticket) {
    const discount = this.getDiscount(ticket);
    const classes = [ticket.soldOut && 'sold-out', ticket.inDemand && 'in-demand'].filter(Boolean);
    return html`
      <li>
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
            ${
              ticket.starts ? html`<p class="dates">${ticket.starts} – ${ticket.ends}</p>` : nothing
            }
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
      </li>
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

  private getDiscount(ticket: Ticket) {
    const primaryTicket = this.ticketsList.find(({ primary }) => primary);
    const maxPrice = primaryTicket?.price;
    if (!ticket.regular || ticket.primary || ticket.soldOut || !maxPrice) {
      return '';
    }
    const discount = new Intl.NumberFormat(getLocale(), { style: 'percent' }).format(
      Math.round(100 - (ticket.price * 100) / maxPrice) / 100,
    );
    return msg(str`Save ${discount} today`, { id: 'home.tickets-block.save' });
  }

  private get ticketsList(): Ticket[] {
    return this.tickets instanceof Success ? this.tickets.data : [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tickets-block': TicketsBlock;
  }
}
