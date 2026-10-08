import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { eventDates, navigation, shortName, timeZone, title } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import { type TicketsState, selectTickets } from '../../store/tickets';
import { type EventState, eventState } from '../../utils/event-state';
import { routeNameFor } from '../../utils/navigation';
import '../shared/hoverboard-icon';
import '../ui/hb-button';
import '../ui/hb-dialog';
import '../ui/hb-icon-button';
import { ThemedElement } from '../themed-element';
import './account-menu';
import './app-install';
import { navigationLabel } from './navigation-label';
import './notification-toggle';

/** The skip link, the header bar and the navigation sheet. The layout keeps it across pages. */
@customElement('app-header')
export class AppHeader extends ThemedElement {
  static override styles = css`
    /* No box of its own, so the header sticks while the whole page scrolls. */
    :host {
      display: contents;
    }

    .skip-link {
      position: fixed;
      z-index: 100;
      inset-block-start: var(--hb-space-2);
      inset-inline-start: var(--hb-space-2);
      padding: var(--hb-space-3) var(--hb-space-4);
      border-radius: var(--hb-radius-full);
      background-color: var(--hb-color-ink);
      color: var(--hb-color-surface);
      font-weight: 600;
      translate: 0 -200%;
    }

    .skip-link:focus {
      translate: none;
    }

    .header {
      position: sticky;
      inset-block-start: 0;
      z-index: 10;
      container-type: inline-size;
      padding: var(--hb-space-3) var(--hb-gutter);
    }

    .bar {
      display: flex;
      align-items: center;
      gap: var(--hb-space-2);
      max-inline-size: var(--hb-content-max);
      margin-inline: auto;
      padding: var(--hb-space-1) var(--hb-space-2) var(--hb-space-1) var(--hb-space-5);
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-full);
      background-color: var(--hb-color-surface-bright);
      color: var(--hb-color-on-surface);
      box-shadow: var(--hb-shadow-card);
    }

    .brand {
      display: flex;
      align-items: center;
      min-block-size: var(--hb-target-min);
      margin-inline-end: auto;
      color: inherit;
      font: 800 var(--hb-text-lg) / 1 var(--hb-font-display);
      text-decoration: none;
    }

    .logo {
      display: var(--hb-logo-display);
      inline-size: 140px;
      block-size: 32px;
      background: var(--hb-logo-image) left center / contain no-repeat;
    }

    .name {
      display: var(--hb-logo-name-display);
    }

    nav ul {
      display: flex;
      gap: var(--hb-space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .nav a {
      display: inline-flex;
      align-items: center;
      min-block-size: var(--hb-target-min);
      padding-inline: var(--hb-space-3);
      border-radius: var(--hb-radius-full);
      color: inherit;
      font-weight: 500;
      text-decoration: none;
      white-space: nowrap;
    }

    .nav a:hover {
      background-color: color-mix(in srgb, currentColor 8%, transparent);
    }

    nav a[aria-current='page'] {
      text-decoration: underline 3px var(--hb-color-primary);
      text-underline-offset: 8px;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--hb-space-1);
    }

    @container (width < 900px) {
      .nav {
        display: none;
      }
    }

    @container (width >= 900px) {
      .menu-button {
        display: none;
      }
    }

    @container (width < 480px) {
      .actions .cta {
        display: none;
      }
    }

    .sheet nav ul {
      flex-direction: column;
      gap: var(--hb-space-2);
    }

    .sheet nav a {
      display: block;
      padding-block: var(--hb-space-2);
      color: inherit;
      font: 700 var(--hb-text-3xl) / 1.1 var(--hb-font-display);
      text-decoration: none;
      overflow-wrap: anywhere;
    }

    .sheet nav a[aria-current='page'] {
      text-decoration: underline 4px var(--hb-color-primary);
      text-underline-offset: 10px;
    }

    .sheet .cta {
      margin-block-start: var(--hb-space-5);
    }

    @media (forced-colors: active) {
      .bar {
        border-color: CanvasText;
      }
    }
  `;

  /** The current page's path. The header follows client navigation itself. */
  @property()
  accessor path = '/';

  /** The event state when the site was built, so the first render matches the server's. */
  @property()
  accessor eventState: EventState = 'upcoming';

  @fromStore(selectTickets)
  private accessor tickets!: TicketsState;

  @state()
  private accessor menuOpen = false;

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('astro:after-swap', this.onAfterSwap);
  }

  override disconnectedCallback() {
    document.removeEventListener('astro:after-swap', this.onAfterSwap);
    super.disconnectedCallback();
  }

  // The event may have started or ended since the build.
  override firstUpdated() {
    this.eventState = eventState(new Date(), {
      startDate: eventDates.start,
      endDate: eventDates.end,
      timezone: timeZone,
    });
  }

  private readonly onAfterSwap = () => {
    this.path = window.location.pathname;
    this.menuOpen = false;
  };

  override render() {
    const label = msg('Main', { id: 'shell.header.nav-label', desc: 'Names the main navigation.' });
    return html`
      <a class="skip-link" href="#main">
        ${msg('Skip to content', { id: 'shell.header.skip-link' })}
      </a>
      <header class="header">
        <div class="bar">
          <a class="brand" href="/">
            <span class="logo" role="img" aria-label="${title}"></span>
            <span class="name">${shortName}</span>
          </a>
          <nav class="nav" aria-label="${label}">${this.renderLinks()}</nav>
          <div class="actions">
            ${this.renderCallToAction()}
            ${__HB_FEATURES__.notifications ? html`<notification-toggle></notification-toggle>` : nothing}
            ${
              __HB_FEATURES__.mySchedule || __HB_FEATURES__.feedback
                ? html`<account-menu></account-menu>`
                : nothing
            }
            <hb-icon-button
              class="menu-button"
              label="${msg('Menu', { id: 'shell.header.menu' })}"
              .expanded="${this.menuOpen}"
              @click="${this.openMenu}"
            >
              <hoverboard-icon name="menu"></hoverboard-icon>
            </hb-icon-button>
          </div>
        </div>
      </header>

      <hb-dialog
        class="sheet"
        fullscreen
        heading="${msg('Menu', { id: 'shell.header.menu' })}"
        ?open="${this.menuOpen}"
        @close="${this.closeMenu}"
      >
        <nav aria-label="${label}" @click="${this.closeMenu}">${this.renderLinks()}</nav>
        ${this.renderCallToAction()}
        <app-install></app-install>
      </hb-dialog>
    `;
  }

  private renderLinks() {
    const routeName = routeNameFor(this.path);
    return html`
      <ul>
        ${navigation.map(
          (nav) => html`
            <li>
              <a
                href="${nav.permalink}"
                aria-current="${nav.route === routeName ? 'page' : nothing}"
                >${navigationLabel(nav.route)}</a
              >
            </li>
          `,
        )}
      </ul>
    `;
  }

  // Tickets until the event is over, otherwise the schedule.
  private renderCallToAction() {
    if (__HB_FEATURES__.tickets && this.eventState !== 'over' && this.ticketUrl) {
      return html`
        <hb-button class="cta" href="${this.ticketUrl}" target="_blank">
          ${msg('Buy ticket', { id: 'common.buy-ticket' })}
        </hb-button>
      `;
    }
    if (__HB_FEATURES__.schedule) {
      return html`<hb-button class="cta" href="/schedule"
        >${navigationLabel('schedule')}</hb-button
      >`;
    }
    return nothing;
  }

  private readonly openMenu = () => {
    this.menuOpen = true;
  };

  private readonly closeMenu = () => {
    this.menuOpen = false;
  };

  private get ticketUrl(): string {
    if (this.tickets instanceof Success && this.tickets.data.length > 0) {
      const ticket = this.tickets.data.find(({ available }) => available) ?? this.tickets.data[0];
      return ticket?.url || '';
    }
    return '';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-header': AppHeader;
  }
}
