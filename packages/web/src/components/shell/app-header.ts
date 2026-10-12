import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { displayFont } from '../../styles/shared';
import { customElement, property, state } from 'lit/decorators.js';
import { archive, eventDates, navigation, shortName, timeZone, title } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import { type TicketsState, selectTickets } from '../../store/tickets';
import { type EventState, eventState } from '../../utils/event-state';
import { routeNameFor } from '../../utils/navigation';
import '../shared/hoverboard-icon';
import '../ui/hb-button';
import '../ui/hb-dialog';
import '../ui/hb-icon-button';
import { ThemedComponent } from '../themed-component';
import './account-menu';
import './app-install';
import './archive-banner';
import { navigationLabel } from './navigation-label';
import { currentTime } from '../../utils/clock';
import './notification-toggle';
import './sync-status';

/** The demo banner, which the header loads without waiting. The server, and tests, wait for it. */
export const demoBanner = __HB_FEATURES__.demo ? import('./demo-banner') : Promise.resolve();

/** The skip link, the header bar and the navigation sheet. The layout keeps it across pages. */
@customElement('app-header')
export class AppHeader extends ThemedComponent {
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
      border-radius: var(--hb-radius-control);
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
      padding: var(--hb-header-inset);
    }

    .bar {
      display: flex;
      align-items: center;
      gap: var(--hb-space-2);
      max-inline-size: var(--hb-header-max-width);
      margin-inline: auto;
      /* A full-width bar lines its content up with the page's column. */
      --bar-extra: (min(100%, var(--hb-header-max-width)) - var(--hb-content-max)) / 2;

      padding-block: var(--hb-space-1);
      padding-inline: max(var(--hb-space-5), var(--bar-extra))
        max(var(--hb-space-2), var(--bar-extra));
      border: 0 solid var(--hb-border-color);
      border-width: var(--hb-header-border-width);
      border-radius: var(--hb-header-radius);
      background-color: var(--hb-panel-background);
      backdrop-filter: var(--hb-backdrop-filter);
      color: var(--hb-color-on-surface);
      box-shadow: var(--hb-header-shadow);
    }

    .brand {
      display: flex;
      flex: var(--hb-header-side-flex, 0 1 auto);
      align-items: center;
      min-block-size: var(--hb-target-min);
      margin-inline-end: auto;
      color: inherit;
      ${displayFont('display', 'lg', 1)};
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
      border-radius: var(--hb-radius-control);
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
      flex: var(--hb-header-side-flex, 0 1 auto);
      align-items: center;
      justify-content: flex-end;
      gap: var(--hb-space-1);
    }

    @container (width < 900px) {
      .nav {
        display: none;
      }
    }

    @container (width >= 900px) {
      .menu-button,
      .actions .cta.in-nav {
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
      ${displayFont('heading', '3xl', 1.1)};
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
    this.eventState = eventState(new Date(currentTime()), {
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
      ${__HB_FEATURES__.demo ? html`<demo-banner></demo-banner>` : nothing}
      ${archive ? html`<archive-banner></archive-banner>` : nothing}
      <header class="header">
        <div class="bar">
          <a class="brand" href="/">
            <span class="logo" role="img" aria-label="${title}"></span>
            <span class="name">${shortName}</span>
          </a>
          <nav class="nav" aria-label="${label}">${this.renderLinks()}</nav>
          <div class="actions">
            <sync-status></sync-status>
            ${this.renderCallToAction()}
            ${__HB_FEATURES__.notifications ? html`<notification-toggle></notification-toggle>` : nothing}
            ${
              (__HB_FEATURES__.mySchedule ||
                __HB_FEATURES__.feedback ||
                __HB_FEATURES__.reactions) &&
              !archive
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
        <nav aria-label="${label}">${this.renderLinks(this.closeMenu)}</nav>
        ${this.renderCallToAction({ inSheet: true })}
        <app-install></app-install>
      </hb-dialog>
    `;
  }

  private renderLinks(onClick?: () => void) {
    const routeName = routeNameFor(this.path);
    return html`
      <ul>
        ${navigation.map(
          (nav) => html`
            <li>
              <a
                href="${nav.permalink}"
                aria-current="${nav.route === routeName ? 'page' : nothing}"
                @click="${onClick}"
                >${navigationLabel(nav.route)}</a
              >
            </li>
          `,
        )}
      </ul>
    `;
  }

  // Tickets until the event is over, otherwise the schedule, unless the navigation links to it.
  private renderCallToAction({ inSheet = false } = {}) {
    if (__HB_FEATURES__.tickets && this.eventState !== 'over' && this.ticketUrl) {
      return html`
        <hb-button class="cta" variant="cta" href="${this.ticketUrl}" target="_blank">
          ${msg('Buy ticket', { id: 'common.buy-ticket' })}
        </hb-button>
      `;
    }
    const inNav = navigation.some((nav) => nav.route === 'schedule');
    if (__HB_FEATURES__.schedule && !(inNav && inSheet)) {
      // The bar keeps it on narrow screens, where the navigation is behind the menu button.
      return html`<hb-button class="cta ${inNav ? 'in-nav' : ''}" variant="cta" href="/schedule"
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
