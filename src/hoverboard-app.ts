import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-header/app-header';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/app-route/app-location';
import '@polymer/app-route/app-route';
import '@polymer/iron-dropdown/iron-dropdown-scroll-manager';
import '@polymer/iron-icon';
import '@polymer/iron-media-query';
import '@polymer/iron-pages';
import '@polymer/iron-selector/iron-selector';
import '@polymer/paper-button';
import '@polymer/paper-icon-button';
import '@polymer/paper-menu-button';
import '@polymer/paper-tabs';
import { html, PolymerElement } from '@polymer/polymer';
import {
  setFastDomIf,
  setLegacyWarnings,
  setPassiveTouchGestures,
  setRemoveNestedTemplates,
  setSuppressTemplateNotifications,
} from '@polymer/polymer/lib/utils/settings';
import 'plastic-image';
import './components/hero-block';
import { log } from './console';
import './elements/dialogs/feedback-dialog';
import './elements/dialogs/previous-speaker-details';
import './elements/dialogs/session-details';
import './elements/dialogs/signin-dialog';
import './elements/dialogs/speaker-details';
import './elements/dialogs/subscribe-dialog';
import './elements/footer-block';
import './elements/header-toolbar';
import './elements/hoverboard-analytics';
import './elements/hoverboard-icons';
import './elements/polymer-helmet';
import './elements/shared-styles';
import './elements/toast-element';
import './elements/video-dialog';
import { ReduxMixin } from './mixins/redux-mixin';
import './pages/blog-page';
import './pages/coc-page';
import './pages/faq-page';
import './pages/home-page';
import './pages/previous-speakers-page';
import './pages/schedule-page';
import './pages/speakers-page';
import './pages/team-page';
import {
  notificationsActions,
  routingActions,
  ticketsActions,
  toastActions,
  uiActions,
  userActions,
} from './redux/actions';
import { State, store } from './redux/store';
import { registerServiceWorker } from './service-worker-registration';
import { TempAny } from './temp-any';
import { scrollToY } from './utils/scrolling';

setFastDomIf(true);
setPassiveTouchGestures(true);
setRemoveNestedTemplates(true);
setSuppressTemplateNotifications(true);
if (location.hostname === 'localhost') {
  setLegacyWarnings(true);
}

class HoverboardApp extends ReduxMixin(PolymerElement) {
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
          --iron-image-height: 32px;
        }

        app-header-layout {
          margin-top: -1px;
        }

        app-header.remove-shadow::before {
          opacity: 0;
        }

        iron-pages {
          background-color: var(--primary-background-color);
          min-height: 100%;
          height: 100%;
        }

        .drawer-content iron-icon {
          --iron-icon-width: 14px;
          margin-left: 6px;
        }

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

      <iron-media-query
        id="mq-phone"
        full
        query="(max-width: {$ mediaQueries.xs.max $})"
        query-matches="{{isPhoneSize}}"
      ></iron-media-query>
      <iron-media-query
        id="mq-laptop"
        full
        query="(min-width: {$ mediaQueries.md.min $})"
        query-matches="{{isLaptopSize}}"
      ></iron-media-query>

      <app-location route="{{appRoute}}"></app-location>
      <app-route
        route="{{appRoute}}"
        pattern="/:page"
        data="{{routeData}}"
        tail="{{subRoute}}"
      ></app-route>

      <app-drawer-layout drawer-width="300px" force-narrow fullbleed>
        <app-drawer id="drawer" slot="drawer" opened="{{drawerOpened}}" swipe-open>
          <app-toolbar layout vertical start>
            <plastic-image
              class="toolbar-logo"
              srcset="/images/logo-monochrome.svg"
              alt="{$ title $}"
            ></plastic-image>
            <h2 class="dates">{$ dates $}</h2>
            <h3 class="location">{$ location.short $}</h3>
          </app-toolbar>

          <div class="drawer-content" layout vertical justified flex>
            <iron-selector
              class="drawer-list"
              selected="[[route.route]]"
              attr-for-selected="path"
              selected-class="selected"
              role="navigation"
            >
              {% for nav in navigation %}
              <a href="{$ nav.permalink $}" path="{$ nav.route $}" on-click="closeDrawer"
                >{$ nav.label $}</a
              >
              {% endfor %}
            </iron-selector>

            <div>
              <a
                class="bottom-drawer-link"
                on-click="_onaddToHomeScreen"
                hidden$="[[_isaddToHomeScreenHidden(addToHomeScreen, viewport.isLaptopPlus)]]"
              >
                {$ addToHomeScreen.cta $}
              </a>

              <a
                class="bottom-drawer-link"
                href$="[[_getTicketUrl(tickets)]]"
                target="_blank"
                rel="noopener noreferrer"
                on-click="closeDrawer"
                ga-on="click"
                ga-event-category="ticket button"
                ga-event-action="buy_click"
                layout
                horizontal
                center
              >
                <span>{$ buyTicket $}</span>
                <iron-icon icon="hoverboard:open-in-new"></iron-icon>
              </a>
            </div>
          </div>
        </app-drawer>

        <app-header-layout id="headerLayout" fullbleed>
          <app-header id="header" slot="header" condenses fixed>
            <header-toolbar drawer-opened="{{drawerOpened}}"></header-toolbar>
          </app-header>

          <iron-pages
            attr-for-selected="name"
            selected="[[route.route]]"
            selected-attribute="active"
            hide-immediately
          >
            <home-page name="home"></home-page>
            <blog-page name="blog" route="[[subRoute]]"></blog-page>
            <schedule-page name="schedule" route="[[subRoute]]"></schedule-page>
            <speakers-page name="speakers" route="[[subRoute]]"></speakers-page>
            <previous-speakers-page
              name="previous-speakers"
              route="[[subRoute]]"
            ></previous-speakers-page>
            <team-page name="team"></team-page>
            <faq-page name="faq"></faq-page>
            <coc-page name="coc"></coc-page>
          </iron-pages>
        </app-header-layout>
      </app-drawer-layout>

      <video-dialog
        opened="[[ui.videoDialog.opened]]"
        video-title="[[ui.videoDialog.title]]"
        youtube-id="[[ui.videoDialog.youtubeId]]"
        entry-animation="scale-up-animation"
        exit-animation="fade-out-animation"
        disable-controls="[[!ui.videoDialog.disableControls]]"
        fit
        fixed-top
      ></video-dialog>

      <speaker-details
        opened="[[dialogs.speaker.isOpened]]"
        speaker="[[dialogs.speaker.data]]"
        with-backdrop="[[viewport.isTabletPlus]]"
        no-cancel-on-outside-click="[[viewport.isPhone]]"
      ></speaker-details>

      <previous-speaker-details
        opened="[[dialogs.previousSpeaker.isOpened]]"
        speaker="[[dialogs.previousSpeaker.data]]"
        with-backdrop="[[viewport.isTabletPlus]]"
        no-cancel-on-outside-click="[[viewport.isPhone]]"
      ></previous-speaker-details>

      <session-details
        opened="[[dialogs.session.isOpened]]"
        session="[[dialogs.session.data]]"
        with-backdrop="[[viewport.isTabletPlus]]"
        no-cancel-on-outside-click="[[viewport.isPhone]]"
      ></session-details>

      <feedback-dialog
        opened="[[dialogs.feedback.isOpened]]"
        session="[[dialogs.feedback.data]]"
        with-backdrop
      ></feedback-dialog>

      <subscribe-dialog
        opened="[[dialogs.subscribe.isOpened]]"
        data="[[dialogs.subscribe.data]]"
        with-backdrop
        no-cancel-on-outside-click="[[viewport.isPhone]]"
      >
      </subscribe-dialog>

      <signin-dialog opened="[[dialogs.signin.isOpened]]" with-backdrop></signin-dialog>

      <hoverboard-analytics></hoverboard-analytics>
      <toast-element></toast-element>
    `;
  }

  static get is() {
    return 'hoverboard-app';
  }

  private ui = {};
  private addToHomeScreen: TempAny;
  private drawerOpened = false;
  private route: { route?: string } = {};
  private dialogs = {};
  private viewport = {};
  private schedule = {};
  private notifications = false;
  private _openedDialog: string;
  private user = {};
  private providerUrls = '{$ signInProviders.allowedProvidersUrl $}'.split(',');
  private tickets = { list: [] };
  private isPhoneSize = false;
  private isLaptopSize = false;
  private appRoute = {};
  private subRoute = {};
  private routeData = {};

  static get properties() {
    return {
      ui: {
        type: Object,
      },
      route: {
        type: Object,
      },
      dialogs: {
        type: Object,
        observer: '_dialogToggled',
      },
      viewport: {
        type: Object,
      },
      schedule: {
        type: Object,
      },
      notifications: {
        type: Boolean,
      },
      _openedDialog: {
        type: String,
      },
      user: {
        type: Object,
      },
      providerUrls: {
        type: Object,
      },
      tickets: {
        type: Object,
      },
      isPhoneSize: Boolean,
      isLaptopSize: Boolean,
      appRoute: Object,
      subRoute: Object,
      routeData: Object,
      addToHomeScreen: Object,
      drawerOpened: Boolean,
    };
  }

  static get observers() {
    return [
      '_routeDataChanged(routeData.page, subRoute.path)',
      '_viewportChanged(isPhoneSize, isLaptopSize)',
    ];
  }

  stateChanged(state: State) {
    this.setProperties({
      dialogs: state.dialogs,
      notifications: state.notifications,
      route: state.routing,
      schedule: state.schedule,
      tickets: state.tickets,
      ui: state.ui,
      user: state.user,
      viewport: state.ui.viewport,
    });
  }

  constructor() {
    super();
    window.performance && performance.mark && performance.mark('hoverboard-app.created');
    this._toggleHeaderShadow = this._toggleHeaderShadow.bind(this);
    this._toggleDrawer = this._toggleDrawer.bind(this);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.addToHomeScreen = e;
    });

    window.addEventListener('load', () => registerServiceWorker());
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('element-sticked', this._toggleHeaderShadow);
    this.$.drawer.addEventListener('opened-changed', this._toggleDrawer);
    window.addEventListener('offline', () => {
      toastActions.showToast({
        message: '{$ offlineMessage $}',
      });
    });
    store.dispatch(ticketsActions.fetchTickets());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('element-sticked', this._toggleHeaderShadow);
    this.$.drawer.removeEventListener('opened-changed', this._toggleDrawer);
  }

  ready() {
    super.ready();
    log('Hoverboard is ready!');
    this.removeAttribute('unresolved');
    userActions.updateUser();
    notificationsActions
      .initializeMessaging()
      .then(() => store.dispatch(notificationsActions.getToken()));
  }

  closeDrawer() {
    this.drawerOpened = false;
  }

  _routeDataChanged(page, subroutePath) {
    if (!page && page !== '') {
      return;
    }
    const hasSubroute = subroutePath !== '' && subroutePath !== '/';

    if (!this.route || page !== this.route.route) {
      !hasSubroute && scrollToY(0, 100);
      routingActions.setRoute(page);
      this.$.header.classList.remove('remove-shadow');
    }

    const canonicalLink = `{$ url $}${page}${subroutePath}`;
    document.querySelector('link[rel="canonical"]').setAttribute('href', canonicalLink);
  }

  _viewportChanged(isPhoneSize, isLaptopSize) {
    uiActions.setViewportSize({
      isPhone: isPhoneSize,
      isTabletPlus: !isPhoneSize,
      isLaptopPlus: isLaptopSize,
    });
  }

  _dialogToggled(dialogs) {
    if (this._openedDialog) {
      document.body.style.overflow = '';
      this._openedDialog = null;
    }
    this._openedDialog = Object.keys(dialogs).find((key) => dialogs[key].isOpened);
    if (this._openedDialog) {
      document.body.style.overflow = 'hidden';
    }
  }

  _toggleHeaderShadow(e) {
    this.$.header.classList.toggle('remove-shadow', e.detail.sticked);
  }

  _toggleDrawer(e) {
    this.drawerOpened = e.detail.value;
  }

  _getTicketUrl(tickets) {
    if (!tickets.list.length) return '';
    const availableTicket = tickets.list.filter((ticket) => ticket.available)[0];
    return availableTicket ? availableTicket.url : tickets.list[0].url;
  }

  _isaddToHomeScreenHidden(addToHomeScreen, isTabletPlus) {
    return isTabletPlus || !addToHomeScreen;
  }

  _onaddToHomeScreen() {
    if (!this.addToHomeScreen) this.closeDrawer();
    this.addToHomeScreen.prompt();
    this.addToHomeScreen.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        ga('send', 'event', 'add_to_home_screen_prompt', 'accepted');
      } else {
        ga('send', 'event', 'add_to_home_screen_prompt', 'dismissed');
      }
      this.addToHomeScreen = null;
      this.closeDrawer();
    });
  }
}

window.customElements.define(HoverboardApp.is, HoverboardApp);
