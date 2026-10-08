import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { ClickOutsideController } from '../../controllers/click-outside-controller';
import { store } from '../../store';
import {
  initialNotificationPermissionState,
  PROMPT_USER,
  requestNotificationPermission,
  unsupportedNotificationPermission,
} from '../../store/notification-permission';
import {
  initialNotificationsSubscribersState,
  selectNotificationsSubscribers,
} from '../../store/notifications-subscribers';
import { selectNotificationsUsersSubscribed } from '../../store/notifications-users';
import {
  clearNotificationsSubscribers,
  updateNotificationsSubscribers,
} from '../../store/update-notifications-subscribers';
import {
  removeNotificationsUsers,
  updateNotificationsUsers,
} from '../../store/update-notifications-users';
import type { UserState } from '../../store/user';
import '../shared/auth-required';
import '../shared/hoverboard-icon';
import '../ui/hb-button';
import '../ui/hb-icon-button';
import '../ui/hb-switch';
import type { HbSwitch } from '../ui/hb-switch';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

const BLOCKED_HELP = 'https://support.google.com/chrome/answer/3220216';
const UNSUPPORTED_HELP =
  'https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API#browser_compatibility';

@customElement('notification-toggle')
export class NotificationToggle extends ThemedElement {
  static override styles = css`
    :host {
      position: relative;
      display: inline-flex;
    }

    .dropdown-panel {
      display: none;
      position: absolute;
      inset-block-start: calc(100% + var(--hb-space-2));
      inset-inline-end: 0;
      z-index: 2;
      inline-size: max-content;
      max-inline-size: min(320px, 100vw - 2 * var(--hb-space-4));
      padding: var(--hb-space-5);
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-m);
      background-color: var(--hb-color-surface-bright);
      color: var(--hb-color-on-surface);
      box-shadow: var(--hb-shadow-card);
    }

    .dropdown-panel[open] {
      display: block;
    }

    .dropdown-panel p {
      margin-top: 0;
    }

    .dropdown-panel .panel-actions {
      display: flex;
      justify-content: flex-end;
      margin: 0 -16px -16px 0;
    }

    .switch-row,
    auth-required {
      margin: 12px 0;
    }

    .switch-row {
      display: flex;
    }
  `;

  @fromStore((state) => state.notificationPermission.value)
  private accessor notificationPermission!: typeof initialNotificationPermissionState.value;
  @fromStore((state) => selectNotificationsSubscribers(state))
  private accessor notificationsSubscribers!: typeof initialNotificationsSubscribersState;
  @fromStore((state) => selectNotificationsUsersSubscribed(state))
  private accessor notificationsUsersSubscribed!: boolean;
  @fromStore((state) => state.user)
  private accessor user!: UserState;

  @state()
  private accessor opened = false;

  private readonly clickOutsideController = new ClickOutsideController(this, () => this.close());

  // After the first render, which must match the server's, where the permission is unknown.
  override firstUpdated() {
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

  override render() {
    return html`
      <hb-icon-button
        class="notifications-trigger"
        label="${msg('Notifications', { id: 'shell.notifications.toggle' })}"
        .expanded="${this.opened}"
        @click="${this.requestPermission}"
      >
        <hoverboard-icon name="${this.icon}"></hoverboard-icon>
      </hb-icon-button>

      <div id="notifications-panel" class="dropdown-panel" ?open="${this.opened}">
        ${
          this.initialized
            ? html`
                <p>${msg('Enable notifications', { id: 'shell.notifications.prompt' })}</p>
                <div class="panel-actions">
                  <hb-button variant="text" @click="${this.requestPermission}">
                    ${msg('Enable', { id: 'shell.notifications.enable' })}
                  </hb-button>
                </div>
              `
            : ''
        }
        ${this.pending ? msg('Loading...', { id: 'common.loading' }) : ''}
        ${
          this.success
            ? html`
                <p>
                  ${msg('Get notified of general announcements and sessions starting', {
                    id: 'shell.notifications.enabled',
                  })}
                </p>
                <hb-switch
                  class="switch-row"
                  .checked="${this.generalNotificationsSelected}"
                  @change="${this.toggleGeneralNotifications}"
                  >${msg('General notifications', { id: 'shell.notifications.general' })}</hb-switch
                >

                <auth-required>
                  <p slot="prompt">
                    ${msg('Sign in to get personalized session notifications', {
                      id: 'shell.notifications.sign-in',
                    })}
                  </p>
                  <hb-switch
                    class="switch-row"
                    .checked="${this.notificationsUsersSubscribed}"
                    @change="${this.toggleMyScheduleNotifications}"
                    >${msg('My Schedule notifications', {
                      id: 'shell.notifications.my-schedule',
                    })}</hb-switch
                  >
                </auth-required>
              `
            : ''
        }
        ${
          this.blocked
            ? html`
                <p>
                  ${msg('Please enable notifications in your browser', {
                    id: 'shell.notifications.blocked',
                  })}
                </p>
                <div class="panel-actions">
                  <hb-button
                    variant="text"
                    href="${BLOCKED_HELP}"
                    target="_blank"
                    @click="${this.close}"
                  >
                    ${msg('Enable', {
                      id: 'shell.notifications.blocked-help',
                      desc: 'Opens help on allowing notifications in the browser.',
                    })}
                  </hb-button>
                </div>
              `
            : ''
        }
        ${
          this.unsupported
            ? html`
                <p>
                  ${msg('Notifications are not supported on this device', {
                    id: 'shell.notifications.unsupported',
                  })}
                </p>
                <div class="panel-actions">
                  <hb-button
                    variant="text"
                    href="${UNSUPPORTED_HELP}"
                    target="_blank"
                    @click="${this.close}"
                  >
                    ${msg('Details', {
                      id: 'shell.notifications.unsupported-help',
                      desc: 'Opens a list of browsers that support notifications.',
                    })}
                  </hb-button>
                </div>
              `
            : ''
        }
        ${
          this.failure
            ? html`<p>${msg('Unknown error occurred', { id: 'shell.notifications.error' })}</p>`
            : ''
        }
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

  private requestPermission = () => {
    if (this.notificationPermission instanceof Initialized) {
      store.dispatch(requestNotificationPermission(PROMPT_USER.YES));
    }
    this.toggleOpened();
  };

  private toggleGeneralNotifications = (event: Event) => {
    const { checked, disabled } = event.target as HbSwitch;
    if (!(this.notificationPermission instanceof Success) || disabled) {
      return;
    }

    if (checked) {
      updateNotificationsSubscribers(this.notificationPermission.data);
    } else {
      clearNotificationsSubscribers(this.notificationPermission.data);
    }
  };

  private toggleMyScheduleNotifications = (event: Event) => {
    const { checked } = event.target as HbSwitch;
    if (!(this.notificationPermission instanceof Success) || !(this.user instanceof Success)) {
      return;
    }

    if (checked) {
      updateNotificationsUsers(this.user.data.uid, this.notificationPermission.data);
    } else {
      removeNotificationsUsers(this.user.data.uid, this.notificationPermission.data);
    }
  };

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
      this.clickOutsideController.stop();
    } else {
      this.clickOutsideController.start();
    }
    this.opened = !this.opened;
  }

  private close = () => {
    this.clickOutsideController.stop();
    this.opened = false;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'notification-toggle': NotificationToggle;
  }
}
