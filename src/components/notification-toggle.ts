import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import '@material/mwc-formfield';
import '@material/mwc-switch';
import { Switch } from '@material/mwc-switch';
import '@material/web/button/text-button.js';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { RootState, store } from '../store';
import { ReduxMixin } from '../store/mixin';
import {
  initialNotificationPermissionState,
  PROMPT_USER,
  requestNotificationPermission,
  unsupportedNotificationPermission,
} from '../store/notification-permission';
import { selectNotificationsSubscribers } from '../store/notifications-subscribers/selectors';
import { initialNotificationsSubscribersState } from '../store/notifications-subscribers/state';
import { selectNotificationsUsersSubscribed } from '../store/notifications-users/selectors';
import {
  clearNotificationsSubscribers,
  updateNotificationsSubscribers,
} from '../store/update-notifications-subscribers/actions';
import {
  removeNotificationsUsers,
  updateNotificationsUsers,
} from '../store/update-notifications-users/actions';
import { initialUserState } from '../store/user/state';
import { loading, notifications } from '../utils/data';
import './auth-required';
import './hoverboard-icon';
import { ThemedElement } from './themed-element';

@customElement('notification-toggle')
export class NotificationToggle extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          position: relative;
        }

        .notifications-trigger {
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
          display: block;
        }

        .dropdown-panel p {
          margin-top: 0;
        }

        .dropdown-panel .panel-actions {
          margin: 0 -16px -16px 0;
        }

        mwc-formfield,
        auth-required {
          margin: 12px 0;
        }
      `,
    ];
  }

  private notifications = notifications;
  private loading = loading;

  @state()
  private notificationPermission = initialNotificationPermissionState.value;
  @state()
  private notificationsSubscribers = initialNotificationsSubscribersState;
  @state()
  private notificationsUsersSubscribed = false;
  @state()
  private user = initialUserState;

  @state()
  private opened = false;

  constructor() {
    super();
    this.clickOutsideListener = this.clickOutsideListener.bind(this);
  }

  override connectedCallback() {
    super.connectedCallback();

    if ('Notification' in window && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((permission) => {
        store.dispatch(requestNotificationPermission(PROMPT_USER.NO));
        permission.onchange = () => {
          store.dispatch(requestNotificationPermission(PROMPT_USER.NO));
        };
      });
    } else {
      store.dispatch(unsupportedNotificationPermission());
    }
  }

  override disconnectedCallback() {
    this.clickOutsideUnlisten();
    super.disconnectedCallback();
  }

  override stateChanged(state: RootState) {
    this.notificationPermission = state.notificationPermission.value;
    this.user = state.user;
    this.notificationsSubscribers = selectNotificationsSubscribers(state);
    this.notificationsUsersSubscribed = selectNotificationsUsersSubscribed(state);
  }

  override render() {
    return html`
      <button
        type="button"
        class="notifications-trigger"
        aria-label="notifications"
        @click="${this.requestPermission}"
      >
        <hoverboard-icon name="${this.icon}"></hoverboard-icon>
      </button>

      <div class="dropdown-panel" ?open="${this.opened}">
        ${
          this.initialized
            ? html`
                <p>${this.notifications.default}</p>
                <div class="panel-actions" layout horizontal end-justified>
                  <md-text-button @click="${this.requestPermission}">
                    ${this.notifications.enable}
                  </md-text-button>
                </div>
              `
            : ''
        }
        ${this.pending ? html`${this.loading}` : ''}
        ${
          this.success
            ? html`
                <p>${this.notifications.enabled}</p>
                <mwc-formfield label="${this.notifications.generalLabel}">
                  <mwc-switch
                    @click="${this.toggleGeneralNotifications}"
                    ?selected="${this.generalNotificationsSelected}"
                  ></mwc-switch>
                </mwc-formfield>

                <auth-required>
                  <p slot="prompt">${this.notifications.signIn}</p>
                  <mwc-formfield label="${this.notifications.myScheduleLabel}">
                    <mwc-switch
                      @click="${this.toggleMyScheduleNotifications}"
                      ?selected="${this.notificationsUsersSubscribed}"
                    ></mwc-switch>
                  </mwc-formfield>
                </auth-required>
              `
            : ''
        }
        ${
          this.blocked
            ? html`
                <p>${this.notifications.blocked.text}</p>
                <div class="panel-actions" layout horizontal end-justified>
                  <a
                    href="${this.notifications.blocked.link}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <md-text-button @click="${this.close}">
                      ${this.notifications.blocked.label}
                    </md-text-button>
                  </a>
                </div>
              `
            : ''
        }
        ${
          this.unsupported
            ? html`
                <p>${this.notifications.unsupported.text}</p>
                <div class="panel-actions" layout horizontal end-justified>
                  <a
                    href="${this.notifications.unsupported.link}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <md-text-button @click="${this.close}">
                      ${this.notifications.unsupported.label}
                    </md-text-button>
                  </a>
                </div>
              `
            : ''
        }
        ${this.failure ? html`<p>${this.notifications.unknown.text}</p>` : ''}
      </div>
    `;
  }

  private get initialized() {
    return (
      this.notificationPermission instanceof Initialized ||
      this.notificationPermission instanceof Pending
    );
  }

  private get pending() {
    return this.notificationPermission instanceof Pending;
  }

  private get blocked() {
    return (
      this.notificationPermission instanceof Failure &&
      this.notificationPermission.error.message === 'denied'
    );
  }

  private get unsupported() {
    return (
      this.notificationPermission instanceof Failure &&
      this.notificationPermission.error.message === 'unsupported'
    );
  }

  private get failure() {
    return (
      this.notificationPermission instanceof Failure &&
      this.notificationPermission.error.message !== 'denied' &&
      this.notificationPermission.error.message !== 'unsupported'
    );
  }

  private get success() {
    return this.notificationPermission instanceof Success;
  }

  private get generalNotificationsSelected() {
    return (
      this.notificationsSubscribers instanceof Success &&
      Boolean(this.notificationsSubscribers.data)
    );
  }

  private requestPermission() {
    if (this.notificationPermission instanceof Initialized) {
      store.dispatch(requestNotificationPermission(PROMPT_USER.YES));
    }
    this.toggleOpened();
  }

  private toggleGeneralNotifications(event: MouseEvent) {
    const { selected, disabled } = event.target as Switch;
    if (!(this.notificationPermission instanceof Success) || disabled) {
      return;
    }

    if (selected) {
      store.dispatch(updateNotificationsSubscribers(this.notificationPermission.data));
    } else {
      store.dispatch(clearNotificationsSubscribers(this.notificationPermission.data));
    }
  }

  private toggleMyScheduleNotifications(event: MouseEvent) {
    const { selected } = event.target as Switch;
    if (!(this.notificationPermission instanceof Success) || !(this.user instanceof Success)) {
      return;
    }

    if (selected) {
      store.dispatch(
        updateNotificationsUsers(this.user.data.uid, this.notificationPermission.data),
      );
    } else {
      store.dispatch(
        removeNotificationsUsers(this.user.data.uid, this.notificationPermission.data),
      );
    }
  }

  private get icon() {
    if (this.notificationPermission instanceof Success) {
      return 'bell';
    } else if (this.notificationPermission instanceof Failure) {
      return 'bell-off';
    } else {
      return 'bell-outline';
    }
  }

  private toggleOpened() {
    if (this.opened) {
      this.clickOutsideUnlisten();
    } else {
      this.clickOutsideListen();
    }
    this.opened = !this.opened;
  }

  private close() {
    this.clickOutsideUnlisten();
    this.opened = false;
  }

  private clickOutsideListen() {
    this.clickOutsideUnlisten();
    window.addEventListener('click', this.clickOutsideListener, false);
  }

  private clickOutsideUnlisten() {
    window.removeEventListener('click', this.clickOutsideListener, false);
  }

  private clickOutsideListener(e: MouseEvent) {
    const isOutside = !e.composedPath().find((path) => path === this);
    if (isOutside) {
      this.close();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'notification-toggle': NotificationToggle;
  }
}
