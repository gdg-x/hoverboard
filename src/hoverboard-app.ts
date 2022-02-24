import { Success } from '@abraham/remotedata';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-header/app-header';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import { computed, customElement, observe, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/iron-selector/iron-selector';
import { html, PolymerElement } from '@polymer/polymer';
import {
  setLegacyWarnings,
  setPassiveTouchGestures,
  setRemoveNestedTemplates,
  setSuppressTemplateNotifications,
} from '@polymer/polymer/lib/utils/settings';
import 'plastic-image';
import './components/snack-bar';
import './elements/dialogs/feedback-dialog';
import './elements/dialogs/signin-dialog';
import './elements/dialogs/subscribe-dialog';
import './elements/dialogs/video-dialog';
import './elements/footer-block';
import './elements/header-toolbar';
import './elements/hoverboard-icons';
import './elements/shared-styles';
import { Stickied } from './elements/sticky-element';
import { selectRouteName, startRouter } from './router';
import { RootState, store } from './store';
import { onUser } from './store/auth/actions';
import { selectIsDialogOpen } from './store/dialogs/selectors';
import { DialogState, initialDialogState } from './store/dialogs/state';
import { DIALOG } from './store/dialogs/types';
import { queueSnackbar } from './store/snackbars';
import { fetchTickets } from './store/tickets/actions';
import { initialTicketsState } from './store/tickets/state';
import { initialUiState } from './store/ui/state';
import {
  buyTicket,
  dates,
  location,
  navigation,
  offlineMessage,
  signInProviders,
  title,
} from './utils/data';
import { isLocalhost } from './utils/environment';
import './utils/media-query';

setPassiveTouchGestures(true);
setRemoveNestedTemplates(true);
setSuppressTemplateNotifications(true);
if (isLocalhost()) {
  setLegacyWarnings(true);
}

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
          --iron-image-height: 32px;
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
            <plastic-image
              class="toolbar-logo"
              srcset="/images/logo-monochrome.svg"
              alt="[[alt]]"
            ></plastic-image>
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

      <feedback-dialog
        opened="[[isFeedbackDialogOpen]]"
        data="[[dialogs.data]]"
        with-backdrop
      ></feedback-dialog>

      <subscribe-dialog></subscribe-dialog>
      <signin-dialog></signin-dialog>

      <snack-bar></snack-bar>
    `;
  }

  private alt = title;
  private dates = dates;
  private buyTicket = buyTicket;
  private navigation = navigation;
  private shortLocation = location.short;

  @property({ type: Object })
  tickets = initialTicketsState;

  @property({ type: Object })
  private ui = initialUiState;
  @property({ type: Boolean })
  private drawerOpened = false;
  @property({ type: Object })
  private dialogs = initialDialogState;
  @property({ type: Object })
  private viewport = initialUiState.viewport;
  @property({ type: Array })
  private providerUrls = signInProviders.allowedProvidersUrl;
  @property({ type: Boolean })
  private isFeedbackDialogOpen = false;
  @property({ type: Boolean })
  private isSubscribeDialogOpen = false;
  @property({ type: String })
  private routeName = 'home';

  stateChanged(state: RootState) {
    this.dialogs = state.dialogs;
    this.isFeedbackDialogOpen = selectIsDialogOpen(state, DIALOG.FEEDBACK);
    this.isSubscribeDialogOpen = selectIsDialogOpen(state, DIALOG.SUBSCRIBE);
    this.tickets = state.tickets;
    this.ui = state.ui;
    this.viewport = state.ui.viewport;
    this.routeName = selectRouteName(window.location.pathname);
  }

  constructor() {
    super();
    this._toggleHeaderShadow = this._toggleHeaderShadow.bind(this);
    this._toggleDrawer = this._toggleDrawer.bind(this);
    store.subscribe(() => this.stateChanged(store.getState()));
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('element-sticked', this._toggleHeaderShadow);
    if (this.$.drawer) {
      this.$.drawer.addEventListener('opened-changed', this._toggleDrawer);
    } else {
      console.error('Unable to find #drawer');
    }
    window.addEventListener('offline', () => store.dispatch(queueSnackbar(offlineMessage)));
    store.dispatch(fetchTickets);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('element-sticked', this._toggleHeaderShadow);
    if (this.$.drawer) {
      this.$.drawer.removeEventListener('opened-changed', this._toggleDrawer);
    } else {
      console.error('Unable to find #drawer');
    }
  }

  override ready() {
    super.ready();
    console.log('Hoverboard is ready!');
    this.removeAttribute('unresolved');
    startRouter(this.shadowRoot!.querySelector('main')!);
    onUser();
  }

  closeDrawer() {
    this.drawerOpened = false;
  }

  @observe('dialogs')
  _dialogToggled(dialogs: DialogState) {
    document.body.style.overflow = dialogs instanceof Success ? 'hidden' : '';
  }

  _toggleHeaderShadow(e: CustomEvent<Stickied>) {
    if (this.$.header) {
      this.$.header.classList.toggle('remove-shadow', e.detail.sticked);
    } else {
      console.error('Unable to find #header');
    }
  }

  _toggleDrawer(e) {
    this.drawerOpened = e.detail.value;
  }

  @computed('tickets')
  get ticketUrl(): string {
    if (this.tickets instanceof Success && this.tickets.data.length > 0) {
      const availableTicket = this.tickets.data.find((ticket) => ticket.available);
      const ticket = availableTicket || this.tickets.data[0];
      return ticket?.url || '';
    } else {
      return '';
    }
  }
}
