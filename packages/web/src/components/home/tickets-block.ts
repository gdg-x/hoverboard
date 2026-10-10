import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { contentLoaders, ticketsBlock } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import type { Ticket } from '../../models/ticket';
import { type TicketsState, selectTickets } from '../../store/tickets';
import { band } from '../../styles/band';
import '../shared/content-loader';
import './ticket-card';
import { ThemedComponent } from '../themed-component';

/** Ticket-shaped cards with the price, a status sticker and a link to buy. */
@customElement('tickets-block')
export class TicketsBlock extends ThemedComponent {
  static override styles = [
    band,
    css`
      .tickets,
      .placeholder {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
        gap: var(--hb-space-6) var(--hb-space-5);
      }

      .details {
        max-inline-size: var(--hb-prose-max);
        margin: var(--hb-space-7) 0 0;
        font-size: var(--hb-text-sm);
      }
    `,
  ];

  @fromStore((state) => selectTickets(state))
  accessor tickets!: TicketsState;

  override render() {
    const fullPrice = this.ticketsList.find(({ primary }) => primary)?.price;
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
          ${this.ticketsList.map(
            (ticket) =>
              html`<li>
                <ticket-card .ticket="${ticket}" .fullPrice="${fullPrice}"></ticket-card>
              </li>`,
          )}
        </ul>
        <p class="details">${ticketsBlock.ticketsDetails}</p>
      </div>
    `;
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
