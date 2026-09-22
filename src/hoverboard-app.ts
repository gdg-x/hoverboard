import { Initialized, Success } from '@abraham/remotedata';
import '@power-elements/lazy-image';
import { css, html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ThemedElement } from './components/themed-element';
import './components/hoverboard-icon';
import './components/snack-bar';
import './components/feedback-dialog';
import './components/signin-dialog';
import './components/subscribe-dialog';
import './components/video-dialog';
import './components/footer-block';
import './components/header-toolbar';
import { selectRouteName, startRouter } from './router';
import { RootState, store } from './store';
import { ReduxMixin } from './store/mixin';
import { onUser } from './store/auth';
import { queueSnackbar } from './store/snackbars';
import { TicketsState, selectTickets } from './store/tickets';
import { DrawerOpenedChanged } from './utils/drawer';
import {
  buyTicket,
  dates,
  location,
  navigation,
  offlineMessage,
  signInProviders,
  title,
} from './utils/data';
import { flexReverse } from './styles/layout';
import './utils/media-query';
import { Stickied } from './utils/stickied';

@customElement('hoverboard-app')
export class HoverboardApp extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      flexReverse,
      css`
        :host {
          display: block;
          position: relative;
          min-height: 100%;
          height: 100%;
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

        main {
          background-color: var(--primary-background-color);
          min-height: 100%;
          height: 100%;
        }

        .drawer-content hoverboard-icon {
          width: 14px;
          height: 14px;
          margin-left: 6px;
        }

        /* Look for copies of this */
        .bottom-drawer-link {
          padding: 16px 24px;
          cursor: pointer;
        }
      `,
    ];
  }

  private alt = title;
  private dates = dates;
  private buyTicket = buyTicket;
  private navigation = navigation;
  private shortLocation = location.short;

  @query('main')
  main!: HTMLElement;
  @query('#header')
  header!: HTMLElement;

  @property({ type: Object })
  tickets: TicketsState = new Initialized();

  @property({ type: Boolean })
  private drawerOpened = false;
  @property({ type: Array })
  private providerUrls = signInProviders.allowedProvidersUrl;
  @property({ type: String })
  private routeName = 'home';

  override stateChanged(state: RootState) {
    this.tickets = selectTickets(state);
    this.routeName = selectRouteName(window.location.pathname);
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('element-sticked', (event) => this.toggleHeaderShadow(event));
    window.addEventListener('offline', () => store.dispatch(queueSnackbar(offlineMessage)));
  }

  override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    console.log('Hoverboard is ready!');
    this.removeAttribute('unresolved');
    startRouter(this.main);
    onUser();
  }

  override render() {
    return html`
      <div class="scrim" ?hidden="${!this.drawerOpened}" @click="${this.closeDrawer}"></div>

      <div id="drawer" class="drawer ${this.drawerOpened ? 'opened' : ''}">
        <div class="drawer-toolbar" layout vertical start>
          <lazy-image
            class="toolbar-logo"
            src="/images/logo-monochrome.svg"
            alt="${this.alt}"
          ></lazy-image>
          <h2 class="dates">${this.dates}</h2>
          <h3 class="location">${this.shortLocation}</h3>
        </div>

        <div class="drawer-content" layout vertical justified flex>
          <nav class="drawer-list" role="navigation">
            ${this.navigation.map(
              (nav) => html`
                <a
                  href="${nav.permalink}"
                  class="${nav.route === this.routeName ? 'selected' : ''}"
                  @click="${this.closeDrawer}"
                >
                  ${nav.label}
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
              layout
              horizontal
              center
            >
              <span>${this.buyTicket}</span>
              <hoverboard-icon name="open-in-new"></hoverboard-icon>
            </a>
          </div>
        </div>
      </div>

      <div id="headerLayout">
        <div id="header" class="app-header">
          <header-toolbar
            .drawerOpened="${this.drawerOpened}"
            @drawer-opened-changed="${this.onDrawerOpenedChanged}"
          ></header-toolbar>
        </div>

        <main></main>
      </div>

      <feedback-dialog></feedback-dialog>
      <signin-dialog></signin-dialog>
      <subscribe-dialog></subscribe-dialog>
      <video-dialog></video-dialog>

      <snack-bar></snack-bar>
    `;
  }

  private closeDrawer() {
    this.drawerOpened = false;
  }

  private toggleHeaderShadow(e: CustomEvent<Stickied>) {
    this.header.classList.toggle('remove-shadow', e.detail.sticked);
  }

  private onDrawerOpenedChanged(e: CustomEvent<DrawerOpenedChanged>) {
    this.drawerOpened = e.detail.value;
  }

  private get ticketUrl(): string {
    if (this.tickets instanceof Success && this.tickets.data.length > 0) {
      const availableTicket = this.tickets.data.find((ticket) => ticket.available);
      const ticket = availableTicket || this.tickets.data[0];
      return ticket?.url || '';
    } else {
      return '';
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hoverboard-app': HoverboardApp;
  }
}
