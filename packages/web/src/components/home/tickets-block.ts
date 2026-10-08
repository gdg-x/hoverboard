import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { Ticket } from '../../models/ticket';
import { type TicketsState, selectTickets } from '../../store/tickets';
import { contentLoaders, ticketsBlock } from '../../config/site';
import { getLocale } from '../../utils/localization';
import '../shared/content-loader';
import '../ui/hb-button';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('tickets-block')
export class TicketsBlock extends ThemedElement {
  static override styles = css`
    .tickets-wrapper {
      text-align: center;
    }

    .tickets {
      margin: 32px 0 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
    }

    .ticket-item {
      margin: 16px 8px;
      width: 100%;
      display: flex;
      flex-direction: column;
      text-align: center;
      color: var(--primary-text-color);
      background-color: var(--default-background-color);
    }

    .ticket-item[in-demand] {
      transform: scale(1.05);
      box-shadow: var(--box-shadow-primary-color);
      border-top: 2px solid var(--default-primary-color);
      z-index: 1;
    }

    .ticket-item[in-demand]:hover {
      box-shadow: var(--box-shadow-primary-color-hover);
    }

    .ticket-item[sold-out] {
      opacity: 0.5;
      filter: grayscale(1);
      cursor: not-allowed;
    }

    .ticket-item[sold-out]:hover {
      box-shadow:
        0 0 2px 0 rgba(0, 0, 0, 0.07),
        0 2px 2px 0 rgba(0, 0, 0, 0.15);
    }

    .header {
      padding: 24px 0 0;
      font-size: 16px;
    }

    .content {
      padding: 0 24px;
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
    }

    .type-description {
      font-size: 12px;
      color: var(--secondary-text-color);
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      justify-content: center;
    }

    .ticket-price-wrapper {
      margin: 24px 0;
      white-space: nowrap;
    }

    .price {
      color: var(--default-primary-color);
      font-size: 40px;
    }

    .discount {
      font-size: 14px;
      color: var(--accent-color);
    }

    .sold-out {
      display: none;
      font-size: 14px;
      text-transform: uppercase;
      height: 32px;
      color: var(--secondary-text-color);
    }

    .sold-out[visible] {
      display: block !important;
    }

    .additional-info {
      margin: 16px auto 0;
      max-width: 480px;
      font-size: 14px;
      color: var(--secondary-text-color);
    }

    .actions {
      padding: 24px;
      position: relative;
    }

    .tickets-placeholder {
      display: grid;
      width: 100%;
    }

    @media (min-width: 640px) {
      .tickets-placeholder {
        grid-template-columns: repeat(auto-fill, 200px);
      }

      .ticket-item {
        max-width: 200px;
      }

      .ticket-item[in-demand] {
        transform: scale(1.15);
      }
    }
  `;

  private get ticketsBlock() {
    return ticketsBlock;
  }
  private contentLoaders = contentLoaders.tickets;

  @fromStore((state) => selectTickets(state))
  accessor tickets!: TicketsState;

  private get pending() {
    return this.tickets instanceof Pending;
  }

  private getDiscount(ticket: Ticket) {
    if (!(this.tickets instanceof Success)) {
      return '';
    }
    const primaryTicket = this.tickets.data.find((ticket) => ticket.primary);
    if (!primaryTicket) {
      return '';
    }
    const maxPrice = primaryTicket && primaryTicket.price;
    if (!ticket.regular || ticket.primary || ticket.soldOut || !maxPrice) {
      return '';
    }
    const discount = new Intl.NumberFormat(getLocale(), { style: 'percent' }).format(
      Math.round(100 - (ticket.price * 100) / maxPrice) / 100,
    );
    return msg(str`Save ${discount} today`, { id: 'home.tickets-block.save' });
  }

  private onTicketTap(e: PointerEvent, ticket: Ticket) {
    if (ticket.soldOut || !ticket.available) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  private getButtonText(available: boolean) {
    return available
      ? msg('Buy ticket', { id: 'common.buy-ticket' })
      : msg('Not available yet', { id: 'home.tickets-block.not-available' });
  }

  private get ticketsList(): Ticket[] {
    return this.tickets instanceof Success ? this.tickets.data : [];
  }

  private get error(): boolean {
    return this.tickets instanceof Failure;
  }

  override render() {
    return html`
      <div class="tickets-wrapper container">
        <h1 class="container-title">${msg('Tickets', { id: 'home.tickets-block.title' })}</h1>
        <content-loader
          class="tickets-placeholder"
          card-padding="24px"
          card-height="216px"
          border-radius="var(--border-radius)"
          title-top-position="32px"
          title-height="42px"
          title-width="70%"
          load-from="-70%"
          load-to="130%"
          animation-time="1s"
          items-count="${this.contentLoaders.itemsCount}"
          ?hidden="${!this.pending}"
        >
        </content-loader>

        <div class="tickets">
          ${this.error ? msg('Error loading tickets', { id: 'home.tickets-block.error' }) : ''}
          ${this.ticketsList.map(
            (ticket) => html`
              <a
                class="ticket-item card"
                href="${ticket.url}"
                target="_blank"
                rel="noopener noreferrer"
                ?sold-out="${ticket.soldOut}"
                ?in-demand="${ticket.inDemand}"
                @click="${(e: PointerEvent) => this.onTicketTap(e, ticket)}"
              >
                <div class="header">
                  <h4>${ticket.name}</h4>
                </div>
                <div class="content">
                  <div class="ticket-price-wrapper">
                    <div class="price">${ticket.currency}${ticket.price}</div>
                    <div class="discount">${this.getDiscount(ticket)}</div>
                  </div>
                  <div class="type-description">
                    <div class="ticket-dates" ?hidden="${!ticket.starts}">
                      ${ticket.starts} - ${ticket.ends}
                    </div>
                    <div class="ticket-info">${ticket.info}</div>
                  </div>
                </div>
                <div class="actions">
                  <div class="sold-out" ?visible="${ticket.soldOut}">
                    ${msg('You missed it!', {
                      id: 'home.tickets-block.sold-out',
                      desc: 'Shown on a sold-out ticket.',
                    })}
                  </div>
                  <!-- Inert, so a click on it follows the ticket link around it. -->
                  <hb-button inert ?hidden="${ticket.soldOut}" ?disabled="${!ticket.available}">
                    ${this.getButtonText(ticket.available)}
                  </hb-button>
                </div>
              </a>
            `,
          )}
        </div>

        <div class="additional-info">*${this.ticketsBlock.ticketsDetails}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tickets-block': TicketsBlock;
  }
}
