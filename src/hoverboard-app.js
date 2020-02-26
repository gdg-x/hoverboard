import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-header-layout/app-header-layout.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-scroll-effects/effects/waterfall.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/app-route/app-location.js';
import '@polymer/app-route/app-route.js';
import '@polymer/iron-dropdown/iron-dropdown-scroll-manager.js';
import '@polymer/iron-icon';
import '@polymer/iron-media-query';
import '@polymer/iron-pages';
import '@polymer/iron-selector/iron-selector.js';
import '@polymer/paper-button';
import '@polymer/paper-icon-button';
import '@polymer/paper-menu-button';
import '@polymer/paper-tabs';
import { html, PolymerElement } from '@polymer/polymer';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings.js';
import 'plastic-image';
import { log } from './console.js';
import './effects/transparent-scroll.js';
import './elements/dialogs/feedback-dialog.js';
import './elements/dialogs/previous-speaker-details.js';
import './elements/dialogs/session-details.js';
import './elements/dialogs/signin-dialog.js';
import './elements/dialogs/speaker-details.js';
import './elements/dialogs/subscribe-dialog.js';
import './elements/footer-block.js';
import './elements/header-toolbar.js';
import './elements/hero-block.js';
import './elements/hoverboard-analytics.js';
import './elements/hoverboard-icons.js';
import './elements/polymer-helmet.js';
import './elements/shared-styles.js';
import './elements/toast-element.js';
import './elements/video-dialog.js';
import { ReduxMixin } from './mixins/redux-mixin.js';
import { ScrollFunctions } from './mixins/scroll-functions.js';
import { UtilsFunctions } from './mixins/utils-functions.js';
import './pages/blog-page.js';
import './pages/coc-page.js';
import './pages/faq-page.js';
import './pages/home-page.js';
import './pages/previous-speakers-page.js';
import './pages/schedule-page.js';
import './pages/speakers-page.js';
import './pages/team-page.js';
import {
  notificationsActions,
  routingActions,
  ticketsActions,
  toastActions,
  uiActions,
  userActions,
} from './redux/actions.js';
import { registerServiceWorker } from './service-worker-registration.js';

class HoverboardApp extends UtilsFunctions(ScrollFunctions(ReduxMixin(PolymerElement))) {
  static get template() {
    return html`
    <style include="shared-styles flex flex-reverse flex-alignment positioning">
      :host {
        display: block;
        position: relative;
        min-height: 100%;
        height: 100%;
        --paper-menu-button-dropdown-background: var(--primary-background-color);;
        --app-drawer-content-container: {
          display: flex;
          flex-direction: column;
        };
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
        background-color: var(--primary-background-color);;
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
      query-matches="{{isPhoneSize}}"></iron-media-query>
    <iron-media-query
      id="mq-laptop"
      full
      query="(min-width: {$ mediaQueries.md.min $})"
      query-matches="{{isLaptopSize}}"></iron-media-query>

    <app-location route="{{appRoute}}"></app-location>
    <app-route route="{{appRoute}}" pattern="/:page" data="{{routeData}}" tail="{{subroute}}"></app-route>

    <app-drawer-layout drawer-width="300px" force-narrow fullbleed>

      <app-drawer id="drawer" slot="drawer" opened="[[ui.isDrawerOpened]]" swipe-open>
        <app-toolbar layout vertical start>
          <plastic-image class="toolbar-logo" srcset="/images/logo-monochrome.svg" alt="{$ title $}"></plastic-image>
          <h2 class="dates">{$ dates $}</h2>
          <h3 class="location">{$ location.short $}</h3>
        </app-toolbar>

        <div class="drawer-content" layout vertical justified flex>
          <iron-selector
            class="drawer-list"
            selected="[[route.route]]"
            attr-for-selected="path"
            selected-class="selected"
            role="navigation">
            {% for nav in navigation %}
            <a href="{$ nav.permalink $}" path="{$ nav.route $}" on-tap="closeDrawer">{$ nav.label $}</a>
            {% endfor %}
          </iron-selector>

          <div>
            <a
              class="bottom-drawer-link"
              on-tap="_onAddToHomescreen"
              hidden$="[[_isAddToHomeScreenHidden(ui.addToHomescreen, viewport.isLaptopPlus)]]">
              {$ addToHomeScreen.cta $}
            </a>

            <a
              class="bottom-drawer-link"
              href$="[[_getTicketUrl(tickets)]]"
              target="_blank"
              rel="noopener noreferrer"
              on-tap="closeDrawer"
              ga-on="click"
              ga-event-category="ticket button"
              ga-event-action="buy_click"
              layout
              horizontal
              center>
              <span>{$ buyTicket $}</span>
              <iron-icon icon="hoverboard:open-in-new"></iron-icon>
            </a>
          </div>
        </div>

      </app-drawer>

      <app-header-layout id="headerLayout" fullbleed>

        <app-header id="header" slot="header" effects="waterfall transparent-scroll" condenses fixed>
          <header-toolbar></header-toolbar>
        </app-header>

        <iron-pages attr-for-selected="name" selected="[[route.route]]" selected-attribute="active" hide-immediately>
          <home-page name="home"></home-page>
          <blog-page name="blog" route="[[subroute]]"></blog-page>
          <schedule-page name="schedule" route="[[subroute]]"></schedule-page>
          <speakers-page name="speakers" route="[[subroute]]"></speakers-page>
          <previous-speakers-page name="previous-speakers" route="[[subroute]]"></previous-speakers-page>
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
      fixed-top></video-dialog>

    <speaker-details
      opened="[[dialogs.speaker.isOpened]]"
      speaker="[[dialogs.speaker.data]]"
      with-backdrop="[[viewport.isTabletPlus]]"
      no-cancel-on-outside-click="[[viewport.isPhone]]"></speaker-details>

    <previous-speaker-details
      opened="[[dialogs.previousSpeaker.isOpened]]"
      speaker="[[dialogs.previousSpeaker.data]]"
      with-backdrop="[[viewport.isTabletPlus]]"
      no-cancel-on-outside-click="[[viewport.isPhone]]"></previous-speaker-details>

    <session-details
      opened="[[dialogs.session.isOpened]]"
      session="[[dialogs.session.data]]"
      with-backdrop="[[viewport.isTabletPlus]]"
      no-cancel-on-outside-click="[[viewport.isPhone]]"></session-details>

    <feedback-dialog
      opened="[[dialogs.feedback.isOpened]]"
      session="[[dialogs.feedback.data]]"
      with-backdrop></feedback-dialog>

    <subscribe-dialog
      opened="[[dialogs.subscribe.isOpened]]"
      data="[[dialogs.subscribe.data]]"
      with-backdrop no-cancel-on-outside-click="[[viewport.isPhone]]">
    </subscribe-dialog>

    <signin-dialog opened="[[dialogs.signin.isOpened]]" with-backdrop></signin-dialog>

    <hoverboard-analytics></hoverboard-analytics>
    <toast-element></toast-element>
`;
  }

  static get is() {
    return 'hoverboard-app';
  }

  static get properties() {
    return {
      ui: {
        type: Object,
      },
      route: {
        type: String,
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
        value: '{$ signInProviders.allowedProvidersUrl $}',
      },
      tickets: {
        type: Object,
      },
    };
  }

  static get observers() {
    return [
      '_routeDataChanged(routeData.page, subroute.path)',
      '_viewportChanged(isPhoneSize, isLaptopSize)',
    ];
  }

  static mapStateToProps(state, _element) {
    return {
      dialogs: state.dialogs,
      notifications: state.notifications,
      route: state.routing,
      schedule: state.schedule,
      tickets: state.tickets,
      ui: state.ui,
      user: state.user,
      viewport: state.ui.viewport,
    };
  }

  constructor() {
    super();
    setPassiveTouchGestures(true);
    window.performance && performance.mark && performance.mark('hoverboard-app.created');
    this._toggleHeaderShadow = this._toggleHeaderShadow.bind(this);
    this._toggleDrawer = this._toggleDrawer.bind(this);

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      uiActions.setAddToHomeScreen(e);
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
    this.dispatchAction(ticketsActions.fetchTickets());
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
    notificationsActions.initializeMessaging()
        .then(() => this.dispatchAction(notificationsActions.getToken()));
  }

  closeDrawer() {
    uiActions.toggleDrawer(false);
  }

  _routeDataChanged(page, subroutePath) {
    if (!page && page !== '') {
      return;
    }
    const hasSubroute = subroutePath !== '' && subroutePath !== '/';

    if (!this.route || (page !== this.route.route)) {
      !hasSubroute && this.scrollToY(0, 100);
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
    uiActions.toggleDrawer(e.detail.value);
  }

  _getTicketUrl(tickets) {
    if (!tickets.list.length) return '';
    const availableTicket = tickets.list.filter((ticket) => ticket.available)[0];
    return availableTicket ? availableTicket.url : tickets.list[0].url;
  }

  _isAddToHomeScreenHidden(addToHomescreen, isTabletPlus) {
    return isTabletPlus || !addToHomescreen;
  }

  _onAddToHomescreen() {
    if (!this.ui.addToHomescreen) this.closeDrawer();
    this.ui.addToHomescreen.prompt();
    this.ui.addToHomescreen.userChoice
        .then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            ga('send', 'event', 'add_to_home_screen_prompt', 'accepted');
          } else {
            ga('send', 'event', 'add_to_home_screen_prompt', 'dismissed');
          }
          uiActions.setAddToHomeScreen(null);
          this.closeDrawer();
        });
  }
}

window.customElements.define(HoverboardApp.is, HoverboardApp);
