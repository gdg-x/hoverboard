import { Success } from '@abraham/remotedata';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import { computed, customElement, observe, property } from '@polymer/decorators';
import '@polymer/paper-button';
import '@polymer/paper-icon-button';
import '@polymer/paper-menu-button';
import '@polymer/paper-tabs';
import { html, PolymerElement } from '@polymer/polymer';
import { Hero } from '../models/hero';
import { selectRouteName } from '../router';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { initialTicketsState, TicketsState } from '../store/tickets/state';
import { initialUiState } from '../store/ui/state';
import { buyTicket, navigation, title } from '../utils/data';
import './shared-styles';

export const HEADER_HEIGHT = 76;

@customElement('header-toolbar')
export class HeaderToolbar extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
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

        app-toolbar {
          margin: 0 auto;
          padding: 0 16px;
          height: auto;
          max-width: var(--max-container-width);
        }

        .toolbar-logo {
          display: block;
          width: 150px;
          height: 32px;
          background-color: var(--default-primary-color);
          transition: background-color var(--animation);
          -webkit-mask: url('/images/logo-monochrome.svg') no-repeat;
        }

        .nav-items {
          --paper-tabs-selection-bar-color: var(--default-primary-color);
          --paper-tabs: {
            height: 64px;
          };
        }

        .nav-item a,
        .signin-tab {
          padding: 0 14px;
          color: inherit;
          text-transform: uppercase;
        }

        .profile-image {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-position: center;
          background-size: cover;
        }

        .dropdown-panel {
          padding: 24px;
          max-width: 300px;
          background: #fff;
          font-size: 16px;
          color: var(--primary-text-color);
        }

        .dropdown-panel p {
          margin-top: 0;
        }

        .dropdown-panel .panel-actions {
          margin: 0 -16px -16px 0;
        }

        paper-button iron-icon {
          margin-right: 8px;
          --iron-icon-fill-color: var(--hero-font-color);
        }

        .buy-button {
          margin-top: 12px;
        }

        @media (min-width: 640px) {
          app-toolbar {
            padding: 0 36px;
            height: initial;
          }
        }
      </style>

      <app-toolbar class="header">
        <div>
          <paper-icon-button
            icon="hoverboard:menu"
            hidden$="[[viewport.isLaptopPlus]]"
            aria-label="menu"
            on-click="openDrawer"
          ></paper-icon-button>
        </div>
        <div layout horizontal center flex>
          <a
            class="toolbar-logo"
            href="/"
            hidden$="[[!viewport.isLaptopPlus]]"
            layout
            horizontal
            title="[[logoTitle]]"
          ></a>
        </div>

        <paper-tabs
          class="nav-items"
          selected="[[routeName]]"
          attr-for-selected="name"
          hidden$="[[!viewport.isLaptopPlus]]"
          role="navigation"
          noink
        >
          <template is="dom-repeat" items="[[navigation]]" as="nav">
            <paper-tab name="[[nav.route]]" class="nav-item" link>
              <a href="[[nav.permalink]]" layout vertical center-center>[[nav.label]]</a>
            </paper-tab>
          </template>

          <a href$="[[ticketUrl]]" target="_blank" rel="noopener noreferrer">
            <paper-button class="buy-button" primary>[[buyTicket]]</paper-button>
          </a>
        </paper-tabs>
      </app-toolbar>
    `;
  }

  private logoTitle = title;
  private navigation = navigation;
  private buyTicket = buyTicket;

  @property({ type: Boolean, notify: true })
  drawerOpened: boolean = false;
  @property({ type: Object })
  tickets: TicketsState = initialTicketsState;

  @property({ type: Object })
  private viewport = initialUiState.viewport;
  @property({ type: Object })
  private heroSettings = initialUiState.heroSettings;
  @property({ type: Boolean, reflectToAttribute: true })
  private transparent = false;
  @property({ type: String })
  private routeName = '';


  override stateChanged(state: RootState) {
    this.tickets = state.tickets;
    this.heroSettings = state.ui.heroSettings;
    this.viewport = state.ui.viewport;
    this.routeName = selectRouteName(window.location.pathname);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.onScroll = this.onScroll.bind(this);
    window.addEventListener('scroll', this.onScroll);
    this.onScroll();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('scroll', this.onScroll);
  }

  private openDrawer() {
    this.drawerOpened = true;
  }

  private onScroll() {
    this.transparent = document.documentElement.scrollTop === 0;
  }

  @computed('tickets')
  private get ticketUrl() {
    if (this.tickets instanceof Success && this.tickets.data.length > 0) {
      const availableTicket = this.tickets.data.find((ticket) => ticket.available);
      return (availableTicket || this.tickets.data[0])?.url || '';
    } else {
      return '';
    }
  }

  @observe('heroSettings')
  private onHeroSettings(settings: Hero) {
    if (!settings) return;
    this.updateStyles({
      '--hero-font-color': settings.fontColor || '',
      '--hero-logo-opacity': settings.hideLogo ? '0' : '1',
      '--hero-logo-color': settings.backgroundImage ? '#fff' : 'var(--default-primary-color)',
    });
  }
}
