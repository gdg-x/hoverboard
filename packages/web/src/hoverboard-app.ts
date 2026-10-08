import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import './components/shell/app-install';
import './components/footer/footer-block';
import './components/shared/hoverboard-icon';
import './components/shell/header-toolbar';
import { navigationLabel } from './components/shell/navigation-label';
import { selectRouteName, startRouter } from './router';
import { store } from './store';
import { onUser } from './store/auth';
import { DIALOG, selectIsDialogOpen } from './store/dialogs';
import { queueSnackbar } from './store/snackbars';
import { type TicketsState, selectTickets } from './store/tickets';
import type { DrawerOpenedChanged } from './utils/drawer';
import { dates, location, navigation, signInProviders, title } from './config/site';
import './utils/media-query';
import { startLocalization } from './utils/localization';
import type { Stickied } from './utils/stickied';
import { ThemedElement } from './components/themed-element';
import { StoreController } from './controllers/store-controller';
import { fromStore } from './controllers/from-store';

type LazyElement =
  'feedback-dialog' | 'signin-dialog' | 'subscribe-dialog' | 'video-dialog' | 'snack-bar';

@customElement('hoverboard-app')
export class HoverboardApp extends ThemedElement {
  static override styles = css`
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
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 16px 24px;
      cursor: pointer;
    }
  `;

  private get alt() {
    return title;
  }
  private get dates() {
    return dates;
  }
  private navigation = navigation;
  private shortLocation = location.short;

  private readonly router = startRouter(this);

  @query('#header')
  accessor header!: HTMLElement;

  @fromStore(selectTickets)
  accessor tickets!: TicketsState;

  @state()
  private accessor drawerOpened = false;
  private providerUrls = signInProviders.allowedProvidersUrl;
  @fromStore(() => selectRouteName(window.location.pathname))
  private accessor routeName!: string;

  // Loaded on first use so they stay out of the initial bundle.
  private readonly lazyElements: Record<LazyElement, () => Promise<unknown>> = {
    'feedback-dialog': () => import('./components/dialogs/feedback-dialog'),
    'signin-dialog': () => import('./components/dialogs/signin-dialog'),
    'subscribe-dialog': () => import('./components/dialogs/subscribe-dialog'),
    'video-dialog': () => import('./components/dialogs/video-dialog'),
    'snack-bar': () => import('./components/shell/snack-bar'),
  };
  private readonly loadingElements = new Set<LazyElement>();
  @state()
  private accessor loadedElements = new Set<LazyElement>();

  private readonly neededElementsStore = new StoreController(
    this,
    (state): Record<LazyElement, boolean> => ({
      'feedback-dialog': selectIsDialogOpen(state, DIALOG.FEEDBACK),
      'signin-dialog': selectIsDialogOpen(state, DIALOG.SIGNIN),
      'subscribe-dialog': selectIsDialogOpen(state, DIALOG.SUBSCRIBE),
      'video-dialog': state.ui.videoDialog.open,
      'snack-bar': state.snackbars.length > 0,
    }),
    {
      equals: (a, b) => (Object.keys(a) as LazyElement[]).every((tag) => a[tag] === b[tag]),
      onChange: (needed) => this.loadNeededElements(needed),
    },
  );

  private loadNeededElements(needed: Record<LazyElement, boolean>) {
    (Object.keys(needed) as LazyElement[]).forEach((tag) => {
      if (!needed[tag] || this.loadedElements.has(tag) || this.loadingElements.has(tag)) {
        return;
      }
      this.loadingElements.add(tag);
      this.lazyElements[tag]()
        .then(() => {
          this.loadedElements = new Set(this.loadedElements).add(tag);
        })
        .catch(() => this.loadingElements.delete(tag));
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    void startLocalization();
    window.addEventListener('element-sticked', this.onElementSticked);
    window.addEventListener('offline', this.onOffline);
  }

  override disconnectedCallback() {
    window.removeEventListener('element-sticked', this.onElementSticked);
    window.removeEventListener('offline', this.onOffline);
    super.disconnectedCallback();
  }

  private readonly onElementSticked = (event: CustomEvent<Stickied>) =>
    this.toggleHeaderShadow(event);

  private readonly onOffline = () =>
    store.dispatch(queueSnackbar(msg('You can still work offline.', { id: 'shell.app.offline' })));

  override firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    console.log('Hoverboard is ready!');
    this.removeAttribute('unresolved');
    onUser();
  }

  override render() {
    return html`
      <div class="scrim" ?hidden="${!this.drawerOpened}" @click="${this.closeDrawer}"></div>

      <div id="drawer" class="drawer ${this.drawerOpened ? 'opened' : ''}">
        <div class="drawer-toolbar">
          <img
            loading="lazy"
            decoding="async"
            class="toolbar-logo"
            src="/images/logo-monochrome.svg"
            alt="${this.alt}"
          />
          <h2 class="dates">${this.dates}</h2>
          <h3 class="location">${this.shortLocation}</h3>
        </div>

        <div class="drawer-content">
          <nav class="drawer-list" role="navigation">
            ${this.navigation.map(
              (nav) => html`
                <a
                  href="${nav.permalink}"
                  class="${nav.route === this.routeName ? 'selected' : ''}"
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

      <div id="headerLayout">
        <div id="header" class="app-header">
          <header-toolbar
            .drawerOpened="${this.drawerOpened}"
            @drawer-opened-changed="${this.onDrawerOpenedChanged}"
          ></header-toolbar>
        </div>

        <main>${this.router.outlet()}</main>
        <footer-block></footer-block>
      </div>

      ${
        this.loadedElements.has('feedback-dialog')
          ? html`<feedback-dialog></feedback-dialog>`
          : nothing
      }
      ${this.loadedElements.has('signin-dialog') ? html`<signin-dialog></signin-dialog>` : nothing}
      ${
        this.loadedElements.has('subscribe-dialog')
          ? html`<subscribe-dialog></subscribe-dialog>`
          : nothing
      }
      ${this.loadedElements.has('video-dialog') ? html`<video-dialog></video-dialog>` : nothing}
      ${this.loadedElements.has('snack-bar') ? html`<snack-bar></snack-bar>` : nothing}
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
