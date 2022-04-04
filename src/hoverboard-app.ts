import { Success } from '@abraham/remotedata';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import { AppDrawerElement } from '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-header/app-header';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import { computed, customElement, property, query } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/iron-selector/iron-selector';
import { html, PolymerElement } from '@polymer/polymer';
import {
  setPassiveTouchGestures,
  setRemoveNestedTemplates,
  setSuppressTemplateNotifications,
} from '@polymer/polymer/lib/utils/settings';
import '@power-elements/lazy-image';
import './components/snack-bar';
import './elements/dialogs/feedback-dialog';
import './elements/dialogs/signin-dialog';
import './elements/dialogs/subscribe-dialog';
import './elements/dialogs/video-dialog';
import './elements/footer-block';
import './elements/header-toolbar';
import './elements/shared-styles';
import { selectRouteName, startRouter } from './router';
import { RootState, store } from './store';
import { onUser } from './store/auth/actions';
import { queueSnackbar } from './store/snackbars';
import { fetchTickets } from './store/tickets/actions';
import { initialTicketsState } from './store/tickets/state';
import { OpenedChanged } from './utils/app-drawer';
import {
  buyTicket,
  dates,
  location,
  navigation,
  offlineMessage,
  signInProviders,
  title,
} from './utils/data';
import './utils/icons';
import './utils/media-query';
import { Stickied } from './utils/stickied';

setPassiveTouchGestures(true);
setRemoveNestedTemplates(true);
setSuppressTemplateNotifications(true);

@customElement('hoverboard-app')
export class HoverboardApp extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles flex flex-reverse flex-alignment positioning">
        :host {
          display: block;
          position: relative;
          min-height: 100%;
          height: 100%;
          --paper-menu-button-dropdown-background: var(--primary-background-color);
          --app-drawer-content-container: {
            display: flex;
            flex-direction: column;
          }
        }

        app-drawer app-toolbar {
          padding: 36px 24px 24px;
          border-bottom: 1px solid var(--divider-color);
        }

        app-drawer .dates {
          margin-top: 42px;
          font-size: 22px;
          line-height: 0.95;
        }

        app-drawer .location {
          margin-top: 4px;
          font-size: 15px;
          color: var(--secondary-text-color);
        }

        .drawer-list {
          padding: 16px 0;
          display: block;
        }

        .drawer-list a {
          display: block;
          color: var(--primary-text-color);
          outline: 0;
        }

        app-drawer a {
          padding: 8px 24px;
        }

        .drawer-list a.selected {
          font-weight: 500;
        }

        app-toolbar {
          height: auto;
        }

        .toolbar-logo {
          --lazy-image-width: auto;
          --lazy-image-height: 32px;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
        }

        app-header-layout {
          margin-top: -1px;
        }

        app-header.remove-shadow::before {
          opacity: 0;
        }

        main {
          background-color: var(--primary-background-color);
          min-height: 100%;
          height: 100%;
        }

        .drawer-content iron-icon {
          --iron-icon-width: 14px;
          margin-left: 6px;
        }

        // Look for copies of this
        .bottom-drawer-link {
          padding: 16px 24px;
          cursor: pointer;
        }

        @media (min-width: 640px) {
          app-toolbar {
            padding: 0 36px;
            height: initial;
          }
        }
      </style>

      <app-drawer-layout drawer-width="300px" force-narrow fullbleed>
        <app-drawer id="drawer" slot="drawer" opened="{{drawerOpened}}" swipe-open>
          <app-toolbar layout vertical start>
            <lazy-image
              class="toolbar-logo"
              src="/images/logo-monochrome.svg"
              alt="[[alt]]"
            ></lazy-image>
            <h2 class="dates">[[dates]]</h2>
            <h3 class="location">[[shortLocation]]</h3>
          </app-toolbar>

          <div class="drawer-content" layout vertical justified flex>
            <iron-selector
              class="drawer-list"
              selected="[[routeName]]"
              attr-for-selected="path"
              selected-class="selected"
              role="navigation"
            >
              <template is="dom-repeat" items="[[navigation]]" as="nav">
                <a href="[[nav.permalink]]" path="[[nav.route]]" on-click="closeDrawer">
                  [[nav.label]]
                </a>
              </template>
            </iron-selector>

            <div>
              <app-install></app-install>

              <a
                class="bottom-drawer-link"
                href$="[[ticketUrl]]"
                target="_blank"
                rel="noopener noreferrer"
                on-click="closeDrawer"
                layout
                horizontal
                center
              >
                <span>[[buyTicket]]</span>
                <iron-icon icon="hoverboard:open-in-new"></iron-icon>
              </a>
            </div>
          </div>
        </app-drawer>

        <app-header-layout id="headerLayout" fullbleed>
          <app-header id="header" slot="header" condenses fixed>
            <header-toolbar drawer-opened="{{drawerOpened}}"></header-toolbar>
          </app-header>

          <main></main>
        </app-header-layout>
      </app-drawer-layout>

      <feedback-dialog></feedback-dialog>
      <signin-dialog></signin-dialog>
      <subscribe-dialog></subscribe-dialog>
      <video-dialog></video-dialog>

      <snack-bar></snack-bar>
    `;
  }

  private alt = title;
  private dates = dates;
  private buyTicket = buyTicket;
  private navigation = navigation;
  private shortLocation = location.short;

  @query('#drawer')
  drawer!: AppDrawerElement;
  @query('main')
  main!: HTMLElement;
  @query('#header')
  header!: HTMLElement;

  @property({ type: Object })
  tickets = initialTicketsState;

  @property({ type: Boolean })
  private drawerOpened = false;
  @property({ type: Array })
  private providerUrls = signInProviders.allowedProvidersUrl;
  @property({ type: String })
  private routeName = 'home';

  stateChanged(state: RootState) {
    this.tickets = state.tickets;
    this.routeName = selectRouteName(window.location.pathname);
  }

  constructor() {
    super();
    store.subscribe(() => this.stateChanged(store.getState()));
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('element-sticked', (event) => this.toggleHeaderShadow(event));
    window.addEventListener('offline', () => store.dispatch(queueSnackbar(offlineMessage)));
    this.drawer.addEventListener('opened-changed', (event) => this.toggleDrawer(event));
    store.dispatch(fetchTickets);
  }

  override ready() {
    super.ready();
    console.log('Hoverboard is ready!');
    this.removeAttribute('unresolved');
    startRouter(this.main);
    onUser();
  }

  closeDrawer() {
    this.drawerOpened = false;
  }

  private toggleHeaderShadow(e: CustomEvent<Stickied>) {
    this.header.classList.toggle('remove-shadow', e.detail.sticked);
  }

  private toggleDrawer(e: CustomEvent<OpenedChanged>) {
    this.drawerOpened = e.detail.value;
  }

  @computed('tickets')
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
