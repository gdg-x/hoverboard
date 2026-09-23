import { Initialized, Success } from '@abraham/remotedata';
import '@material/web/button/filled-button.js';
import { css, html, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ClickOutsideController } from '../controllers/click-outside-controller';
import { Hero } from '../models/hero';
import { selectRouteName } from '../router';
import { RootState } from '../store';
import { signOut as signOutAction } from '../store/auth';
import { closeDialog, DIALOG, openSigninDialog, selectIsDialogOpen } from '../store/dialogs';
import { ReduxMixin } from '../store/mixin';
import { TicketsState, selectTickets } from '../store/tickets';
import { initialUiState } from '../store/ui';
import { UserState } from '../store/user';
import { updateSelectionBar } from '../utils/tab-selection-bar';
import { buyTicket, navigation, signIn, signOut as signOutText, title } from '../utils/data';
import './hoverboard-icon';
import './notification-toggle';
import { ThemedElement } from './themed-element';

export const HEADER_HEIGHT = 76;

@customElement('header-toolbar')
export class HeaderToolbar extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          --iron-icon-fill-color: currentColor;
          display: block;
          z-index: 1;
          border-bottom: 1px solid var(--divider-color);
          background-color: var(--primary-background-color);
          transition:
            background-color var(--animation),
            border-bottom-color var(--animation),
            color var(--animation);
          color: var(--primary-text-color);
        }

        :host([transparent]) {
          --iron-icon-fill-color: var(--hero-font-color, '#fff');
          background-color: transparent;
          border-bottom-color: transparent;
          color: var(--hero-font-color, '#fff');
        }

        :host([transparent]) .toolbar-logo {
          background-color: var(--hero-logo-color);
          opacity: var(--hero-logo-opacity, 1);
        }

        .toolbar {
          display: flex;
          align-items: center;
          margin: 0 auto;
          padding: 0 16px;
          height: auto;
          max-width: var(--max-container-width);
        }

        .toolbar-logo {
          display: flex;
          flex-direction: row;
          width: 150px;
          height: 32px;
          background-color: var(--default-primary-color);
          transition: background-color var(--animation);
          -webkit-mask: url('/images/logo-monochrome.svg') no-repeat;
          mask: url('/images/logo-monochrome.svg') no-repeat;
        }

        .brand {
          display: flex;
          flex: 1;
          flex-basis: 1px;
          flex-direction: row;
          align-items: center;
        }

        .nav-items {
          position: relative;
          display: flex;
          align-items: stretch;
          height: 64px;
        }

        .selection-bar {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          width: 0;
          background-color: var(--default-primary-color);
          transition:
            left 0.2s ease,
            width 0.2s ease;
          pointer-events: none;
        }

        .nav-item {
          display: flex;
          align-items: center;
        }

        .nav-item a,
        .signin-tab {
          padding: 0 14px;
          color: inherit;
          text-transform: uppercase;
        }

        .signin-tab {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .icon-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          cursor: pointer;
          background: none;
          border: none;
          color: inherit;
          padding: 0;
        }

        .profile-menu {
          position: relative;
          display: inline-flex;
        }

        .profile-image {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-position: center;
          background-size: cover;
          cursor: pointer;
        }

        .dropdown-panel {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 2;
          padding: 24px;
          max-width: 300px;
          background: #fff;
          box-shadow: var(--box-shadow);
          font-size: 16px;
          color: var(--primary-text-color);
        }

        .dropdown-panel[open] {
          display: flex;
          flex-direction: row;
        }

        .dropdown-panel .panel-actions {
          margin: 0 -16px -16px 0;
        }

        .profile-details .profile-image {
          align-self: center;
          margin-right: 16px;
          width: 48px;
          height: 48px;
          cursor: default;
        }

        .profile-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .profile-name,
        .profile-email {
          font-size: 14px;
          display: block;
          white-space: nowrap;
          color: var(--secondary-text-color);
        }

        .profile-action {
          margin-top: 4px;
          text-transform: uppercase;
          color: var(--default-primary-color);
          font-size: 14px;
          cursor: pointer;
        }

        md-filled-button hoverboard-icon {
          margin-right: 8px;
          --iron-icon-fill-color: var(--hero-font-color);
        }

        .buy-button {
          margin-top: 12px;
        }

        @media (min-width: 640px) {
          .toolbar {
            padding: 0 36px;
            height: initial;
          }
        }
      `,
    ];
  }

  private logoTitle = title;
  private signInText = signIn;
  private navigation = navigation;
  private signOutText = signOutText;
  private buyTicket = buyTicket;

  @property({ type: Boolean, attribute: 'drawer-opened' })
  drawerOpened = false;
  @property({ type: Object })
  tickets: TicketsState = new Initialized();

  @state()
  private viewport = initialUiState.viewport;
  @state()
  private heroSettings: Hero | undefined = initialUiState.heroSettings;
  @state()
  private signedIn = false;
  @state()
  private user: UserState = new Initialized();
  // Intentionally @property (not @state): `reflect` is required so the
  // `:host([transparent])` CSS selector can style the host, and @state
  // does not support reflection.
  @property({ type: Boolean, reflect: true })
  private transparent = false;
  @state()
  private routeName = '';
  @state()
  private isDialogOpen = false;
  @state()
  private profileMenuOpened = false;

  private readonly clickOutsideController = new ClickOutsideController(this, () =>
    this.closeProfileMenu(),
  );

  override stateChanged(state: RootState) {
    this.user = state.user;
    this.signedIn = state.user instanceof Success;
    this.tickets = selectTickets(state);
    this.heroSettings = state.ui.heroSettings;
    this.viewport = state.ui.viewport;
    this.routeName = selectRouteName(window.location.pathname);
    this.isDialogOpen = selectIsDialogOpen(state, DIALOG.SIGNIN);
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('scroll', this.onScroll);
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('signedIn')) {
      this.onSignedIn();
    }
    if (changedProperties.has('heroSettings')) {
      this.onHeroSettings(this.heroSettings);
    }
  }

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    this.positionSelectionBar();
  }

  private positionSelectionBar() {
    const container = this.renderRoot.querySelector('.nav-items');
    const selected = container?.querySelector<HTMLElement>('.nav-item.selected');
    const bar = container?.querySelector<HTMLElement>('.selection-bar');
    updateSelectionBar(bar, selected);
  }

  override render() {
    return html`
      <div class="toolbar header">
        <div>
          <button
            type="button"
            class="icon-button"
            aria-label="menu"
            ?hidden="${this.viewport.isLaptopPlus}"
            @click="${this.openDrawer}"
          >
            <hoverboard-icon name="menu"></hoverboard-icon>
          </button>
        </div>
        <div class="brand">
          <a
            class="toolbar-logo"
            href="/"
            ?hidden="${!this.viewport.isLaptopPlus}"
            title="${this.logoTitle}"
          ></a>
        </div>

        <nav class="nav-items" ?hidden="${!this.viewport.isLaptopPlus}" role="navigation">
          <span class="selection-bar"></span>
          ${this.navigation.map(
            (nav) => html`
              <div class="nav-item ${nav.route === this.routeName ? 'selected' : ''}">
                <a href="${nav.permalink}">${nav.label}</a>
              </div>
            `,
          )}

          <div
            class="signin-tab"
            role="button"
            tabindex="0"
            @click="${this.signIn}"
            ?hidden="${this.signedIn}"
          >
            ${this.signInText}
          </div>

          <a href="${this.ticketUrl}" target="_blank" rel="noopener noreferrer">
            <md-filled-button class="buy-button">${this.buyTicket}</md-filled-button>
          </a>
        </nav>

        <notification-toggle></notification-toggle>

        <div class="profile-menu" ?hidden="${!this.signedIn}">
          <div
            class="profile-image"
            style="background-image: url('${
              this.user instanceof Success ? this.user.data.photoURL : ''
            }')"
            @click="${this.toggleProfileMenu}"
          ></div>
          <div class="dropdown-panel profile-details" ?open="${this.profileMenuOpened}">
            <div
              class="profile-image"
              style="background-image: url('${
                this.user instanceof Success ? this.user.data.photoURL : ''
              }')"
            ></div>
            <div class="profile-copy">
              <span class="profile-name">
                ${this.user instanceof Success ? this.user.data.displayName : ''}
              </span>
              <span class="profile-email">
                ${this.user instanceof Success ? this.user.data.email : ''}
              </span>
              <span class="profile-action" role="button" @click="${this.signOut}">
                ${this.signOutText}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="icon-button"
          aria-label="account"
          @click="${this.signIn}"
          ?hidden="${this.isAccountIconHidden}"
        >
          <hoverboard-icon name="account"></hoverboard-icon>
        </button>
      </div>
    `;
  }

  private openDrawer = () => {
    this.setDrawerOpened(true);
  };

  private setDrawerOpened(value: boolean) {
    this.drawerOpened = value;
    this.dispatchEvent(
      new CustomEvent('drawer-opened-changed', {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private signIn = () => {
    openSigninDialog();
  };

  private signOut = () => {
    signOutAction();
    this.closeProfileMenu();
  };

  private onScroll = () => {
    this.transparent = document.documentElement.scrollTop === 0;
  };

  private onSignedIn() {
    if (this.isDialogOpen) {
      closeDialog();
    }
  }

  private get isAccountIconHidden() {
    return this.signedIn || this.viewport.isLaptopPlus;
  }

  private get ticketUrl() {
    if (this.tickets instanceof Success && this.tickets.data.length > 0) {
      const availableTicket = this.tickets.data.find((ticket) => ticket.available);
      return (availableTicket || this.tickets.data[0])?.url || '';
    } else {
      return '';
    }
  }

  private onHeroSettings(settings: Hero | undefined) {
    if (!settings) return;
    this.style.setProperty('--hero-font-color', settings.fontColor || '');
    this.style.setProperty('--hero-logo-opacity', settings.hideLogo ? '0' : '1');
    this.style.setProperty(
      '--hero-logo-color',
      settings.backgroundImage ? '#fff' : 'var(--default-primary-color)',
    );
  }

  private toggleProfileMenu = () => {
    if (this.profileMenuOpened) {
      this.clickOutsideController.stop();
    } else {
      this.clickOutsideController.start();
    }
    this.profileMenuOpened = !this.profileMenuOpened;
  };

  private closeProfileMenu() {
    this.clickOutsideController.stop();
    this.profileMenuOpened = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'header-toolbar': HeaderToolbar;
  }
}
