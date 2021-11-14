import { Success } from '@abraham/remotedata';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-header/app-header';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/app-route/app-location';
import '@polymer/app-route/app-route';
import { computed, customElement, observe, property } from '@polymer/decorators';
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
import './elements/dialogs/video-dialog';
import './elements/footer-block';
import './elements/header-toolbar';
import './elements/hoverboard-analytics';
import './elements/hoverboard-icons';
import './elements/polymer-helmet';
import './elements/shared-styles';
import './elements/toast-element';
import { ReduxMixin } from './mixins/redux-mixin';
import './pages/blog-page';
import './pages/coc-page';
import './pages/faq-page';
import './pages/home-page';
import './pages/previous-speakers-page';
import './pages/schedule-page';
import './pages/speakers-page';
import './pages/team-page';
import { registerServiceWorker } from './service-worker-registration';
import { RootState, store } from './store';
import { DialogState, initialDialogState } from './store/dialogs/state';
import { DIALOGS } from './store/dialogs/types';
import { getToken } from './store/notifications/actions';
import { setRoute } from './store/routing/actions';
import { initialRoutingState, RoutingState } from './store/routing/state';
import { fetchTickets } from './store/tickets/actions';
import { initialTicketsState, TicketsState } from './store/tickets/state';
import { showToast } from './store/toast/actions';
import { setViewportSize } from './store/ui/actions';
import { updateUser } from './store/user/actions';
import { TempAny } from './temp-any';
import { isDialogOpen } from './utils/dialogs';
import { scrollToY } from './utils/scrolling';

setFastDomIf(true);
setPassiveTouchGestures(true);
setRemoveNestedTemplates(true);
setSuppressTemplateNotifications(true);
if (location.hostname === 'localhost') {
  setLegacyWarnings(true);
}

@customElement('hoverboard-app')
export class HoverboardApp extends ReduxMixin(PolymerElement) {
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
                href$="[[ticketUrl]]"
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
        title="[[ui.videoDialog.title]]"
        youtube-id="[[ui.videoDialog.youtubeId]]"
        entry-animation="scale-up-animation"
        exit-animation="fade-out-animation"
        disable-controls="[[!ui.videoDialog.disableControls]]"
        fit
        fixed-top
      ></video-dialog>

      <speaker-details
        opened="[[isSpeakerDialogOpen]]"
        data="[[dialogs.data]]"
        with-backdrop="[[viewport.isTabletPlus]]"
        no-cancel-on-outside-click="[[viewport.isPhone]]"
      ></speaker-details>

      <previous-speaker-details
        opened="[[isPreviousSpeakerDialogOpen]]"
        data="[[dialogs.data]]"
        with-backdrop="[[viewport.isTabletPlus]]"
        no-cancel-on-outside-click="[[viewport.isPhone]]"
      ></previous-speaker-details>

      <session-details
        opened="[[isSessionDialogOpen]]"
        data="[[dialogs.data]]"
        with-backdrop="[[viewport.isTabletPlus]]"
        no-cancel-on-outside-click="[[viewport.isPhone]]"
      ></session-details>

      <feedback-dialog
        opened="[[isFeedbackDialogOpen]]"
        data="[[dialogs.data]]"
        with-backdrop
      ></feedback-dialog>

      <subscribe-dialog
        opened="[[isSubscribeDialogOpen]]"
        data="[[dialogs.data.data]]"
        with-backdrop
        no-cancel-on-outside-click="[[viewport.isPhone]]"
      >
      </subscribe-dialog>

      <signin-dialog opened="[[isSigninDialogOpen]]" with-backdrop></signin-dialog>

      <hoverboard-analytics></hoverboard-analytics>
      <toast-element></toast-element>
    `;
  }

  @property({ type: Object })
  tickets: TicketsState = initialTicketsState;

  @property({ type: Object })
  private ui = {};
  @property({ type: Object })
  private addToHomeScreen: TempAny;
  @property({ type: Boolean })
  private drawerOpened = false;
  @property({ type: Object })
  private route: RoutingState = initialRoutingState;
  @property({ type: Object })
  private dialogs: DialogState = initialDialogState;
  @property({ type: Object })
  private viewport = {};
  @property({ type: Object })
  private notifications;
  @property({ type: Boolean })
  private _openedDialog = false;
  @property({ type: Object })
  private user = {};
  @property({ type: Array })
  private providerUrls = '{$ signInProviders.allowedProvidersUrl $}'.split(',');
  @property({ type: Boolean })
  private isPhoneSize = false;
  @property({ type: Boolean })
  private isLaptopSize = false;
  @property({ type: Object })
  private appRoute = {};
  @property({ type: Object })
  private subRoute = {};
  @property({ type: Object })
  private routeData = {};
  @property({ type: Boolean })
  private isSigninDialogOpen = false;
  @property({ type: Boolean })
  private isSpeakerDialogOpen = false;
  @property({ type: Boolean })
  private isPreviousSpeakerDialogOpen = false;
  @property({ type: Boolean })
  private isSessionDialogOpen = false;
  @property({ type: Boolean })
  private isFeedbackDialogOpen = false;
  @property({ type: Boolean })
  private isSubscribeDialogOpen = false;

  stateChanged(state: RootState) {
    this.dialogs = state.dialogs;
    this.isSigninDialogOpen = isDialogOpen(this.dialogs, DIALOGS.SIGNIN);
    this.isSpeakerDialogOpen = isDialogOpen(this.dialogs, DIALOGS.SPEAKER);
    this.isPreviousSpeakerDialogOpen = isDialogOpen(this.dialogs, DIALOGS.PREVIOUS_SPEAKER);
    this.isSessionDialogOpen = isDialogOpen(this.dialogs, DIALOGS.SESSION);
    this.isFeedbackDialogOpen = isDialogOpen(this.dialogs, DIALOGS.FEEDBACK);
    this.isSubscribeDialogOpen = isDialogOpen(this.dialogs, DIALOGS.SUBSCRIBE);
    this.notifications = state.notifications;
    this.route = state.routing;
    this.tickets = state.tickets;
    this.ui = state.ui;
    this.user = state.user;
    this.viewport = state.ui.viewport;
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
      showToast({
        message: '{$ offlineMessage $}',
      });
    });
    store.dispatch(fetchTickets());
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
    updateUser();
    store.dispatch(getToken());
  }

  closeDrawer() {
    this.drawerOpened = false;
  }

  @observe('routeData.page', 'subRoute.path')
  _routeDataChanged(page, subroutePath) {
    if (!page && page !== '') {
      return;
    }
    const hasSubroute = subroutePath !== '' && subroutePath !== '/';

    if (!this.route || page !== this.route.route) {
      !hasSubroute && scrollToY(0, 100);
      setRoute(page);
      this.$.header.classList.remove('remove-shadow');
    }

    const canonicalLink = `{$ url $}${page}${subroutePath}`;
    document.querySelector('link[rel="canonical"]').setAttribute('href', canonicalLink);
  }

  @observe('isPhoneSize', 'isLaptopSize')
  _viewportChanged(isPhoneSize, isLaptopSize) {
    setViewportSize({
      isPhone: isPhoneSize,
      isTabletPlus: !isPhoneSize,
      isLaptopPlus: isLaptopSize,
    });
  }

  @observe('dialogs')
  _dialogToggled(dialogs: DialogState) {
    document.body.style.overflow = dialogs instanceof Success ? 'hidden' : '';
  }

  _toggleHeaderShadow(e) {
    this.$.header.classList.toggle('remove-shadow', e.detail.sticked);
  }

  _toggleDrawer(e) {
    this.drawerOpened = e.detail.value;
  }

  @computed('tickets')
  get ticketUrl(): string {
    if (this.tickets instanceof Success && this.tickets.data.length > 0) {
      const availableTicket = this.tickets.data.find((ticket) => ticket.available);
      return (availableTicket || this.tickets.data[0]).url;
    } else {
      return '';
    }
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
