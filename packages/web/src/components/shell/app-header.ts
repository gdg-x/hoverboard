import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { location, navigation, title } from '../../config/site';
import { fromStore } from '../../controllers/from-store';
import { type TicketsState, selectTickets } from '../../store/tickets';
import { getEventDates } from '../../utils/dates';
import type { DrawerOpenedChanged } from '../../utils/drawer';
import { routeNameFor } from '../../utils/navigation';
import type { Stickied } from '../../utils/stickied';
import '../shared/hoverboard-icon';
import { ThemedElement } from '../themed-element';
import './app-install';
import './header-toolbar';
import { navigationLabel } from './navigation-label';

/** The header and the navigation drawer. The layout keeps it across page navigations. */
@customElement('app-header')
export class AppHeader extends ThemedElement {
  static override styles = css`
    /* No box of its own, so the header sticks while the whole page scrolls. */
    :host {
      display: contents;
    }

    .scrim {
      position: fixed;
      inset: 0;
      z-index: 10;
      background-color: rgb(0 0 0 / 40%);
    }

    .drawer {
      position: fixed;
      inset: 0 auto 0 0;
      z-index: 11;
      display: flex;
      flex-direction: column;
      width: 300px;
      max-width: 90vw;
      background-color: var(--primary-background-color);
      box-shadow: var(--box-shadow);
      transform: translateX(-100%);
      transition: transform var(--animation);
    }

    .drawer.opened {
      transform: translateX(0);
    }

    .drawer-toolbar {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 36px 24px 24px;
      height: auto;
      border-bottom: 1px solid var(--divider-color);
    }

    @media (min-width: 640px) {
      .drawer-toolbar {
        padding: 0 36px;
        height: initial;
      }
    }

    .dates {
      margin-top: 42px;
      font-size: 22px;
      line-height: 0.95;
    }

    .location {
      margin-top: 4px;
      font-size: 15px;
      color: var(--secondary-text-color);
    }

    .drawer-content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
      padding: 16px 0;
    }

    .drawer-list a {
      display: block;
      padding: 8px 24px;
      color: var(--primary-text-color);
      outline: 0;
    }

    .drawer-list a.selected {
      font-weight: 500;
    }

    .toolbar-logo {
      --lazy-image-width: auto;
      --lazy-image-height: 32px;
      --lazy-image-fit: cover;
      width: var(--lazy-image-width);
      height: var(--lazy-image-height);
    }

    .app-header {
      position: sticky;
      top: 0;
      z-index: 2;
      box-shadow: var(--box-shadow);
      transition: box-shadow var(--animation);
    }

    .app-header.remove-shadow {
      box-shadow: none;
    }

    .drawer-content hoverboard-icon {
      width: 14px;
      height: 14px;
      margin-left: 6px;
    }

    .bottom-drawer-link {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 16px 24px;
      cursor: pointer;
    }
  `;

  /** The current page's path. The header follows client navigation itself. */
  @property()
  accessor path = '/';

  @query('#header')
  private accessor header!: HTMLElement;

  @fromStore(selectTickets)
  private accessor tickets!: TicketsState;

  @state()
  private accessor drawerOpened = false;

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('astro:after-swap', this.onAfterSwap);
    window.addEventListener('element-sticked', this.onElementSticked);
  }

  override disconnectedCallback() {
    document.removeEventListener('astro:after-swap', this.onAfterSwap);
    window.removeEventListener('element-sticked', this.onElementSticked);
    super.disconnectedCallback();
  }

  private readonly onAfterSwap = () => {
    this.path = window.location.pathname;
    this.drawerOpened = false;
  };

  private readonly onElementSticked = (event: CustomEvent<Stickied>) => {
    this.header.classList.toggle('remove-shadow', event.detail.sticked);
  };

  override render() {
    const routeName = routeNameFor(this.path);

    return html`
      <div class="scrim" ?hidden="${!this.drawerOpened}" @click="${this.closeDrawer}"></div>

      <div id="drawer" class="drawer ${this.drawerOpened ? 'opened' : ''}">
        <div class="drawer-toolbar">
          <img
            loading="lazy"
            decoding="async"
            class="toolbar-logo"
            src="/images/logo-monochrome.svg"
            alt="${title}"
          />
          <h2 class="dates">${getEventDates()}</h2>
          <h3 class="location">${location.short}</h3>
        </div>

        <div class="drawer-content">
          <nav class="drawer-list" role="navigation">
            ${navigation.map(
              (nav) => html`
                <a
                  href="${nav.permalink}"
                  class="${nav.route === routeName ? 'selected' : ''}"
                  @click="${this.closeDrawer}"
                >
                  ${navigationLabel(nav.route)}
                </a>
              `,
            )}
          </nav>

          <div>
            <app-install></app-install>

            <a
              class="bottom-drawer-link"
              href="${this.ticketUrl}"
              target="_blank"
              rel="noopener noreferrer"
              @click="${this.closeDrawer}"
            >
              <span>${msg('Buy ticket', { id: 'common.buy-ticket' })}</span>
              <hoverboard-icon name="open-in-new"></hoverboard-icon>
            </a>
          </div>
        </div>
      </div>

      <div id="header" class="app-header">
        <header-toolbar
          .path="${this.path}"
          .drawerOpened="${this.drawerOpened}"
          @drawer-opened-changed="${this.onDrawerOpenedChanged}"
        ></header-toolbar>
      </div>
    `;
  }

  private readonly closeDrawer = () => {
    this.drawerOpened = false;
  };

  private readonly onDrawerOpenedChanged = (event: CustomEvent<DrawerOpenedChanged>) => {
    this.drawerOpened = event.detail.value;
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
