import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { store } from '../../store';
import {
  initialNotificationPermissionState,
  PROMPT_USER,
  requestNotificationPermission,
} from '../../store/notification-permission';
import {
  initialNotificationsSubscribersState,
  selectNotificationsSubscribers,
} from '../../store/notifications-subscribers';
import { selectNotificationsUsersSubscribed } from '../../store/notifications-users';
import { selectOnline } from '../../store/sync';
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
import '../ui/hb-button';
import '../ui/hb-switch';
import type { HbSwitch } from '../ui/hb-switch';
import { ThemedComponent } from '../themed-component';

const BLOCKED_HELP = 'https://support.google.com/chrome/answer/3220216';
const UNSUPPORTED_HELP =
  'https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API#browser_compatibility';

/**
 * What the notifications panel shows for each permission state: a way to turn them on, the
 * general and My Schedule switches, or why they can't be on. Fires `close` when it is done.
 */
@customElement('notification-settings')
export class NotificationSettings extends ThemedComponent {
  static override styles = css`
    :host {
      display: block;
    }

    p {
      margin-top: 0;
    }

    .panel-actions {
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

    .offline {
      font-weight: 600;
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
  @fromStore(selectOnline)
  private accessor online!: boolean;

  override render() {
    const permission = this.notificationPermission;
    if (permission instanceof Initialized || permission instanceof Pending) {
      return this.renderPrompt(permission instanceof Pending);
    }
    if (permission instanceof Success) return this.renderSwitches(permission.data);
    if (permission instanceof Failure && permission.error.message === 'denied') {
      return this.renderHelp(
        msg('Please enable notifications in your browser', { id: 'shell.notifications.blocked' }),
        BLOCKED_HELP,
        msg('Enable', {
          id: 'shell.notifications.blocked-help',
          desc: 'Opens help on allowing notifications in the browser.',
        }),
      );
    }
    if (permission instanceof Failure && permission.error.message === 'unsupported') {
      return this.renderHelp(
        msg('Notifications are not supported on this device', {
          id: 'shell.notifications.unsupported',
        }),
        UNSUPPORTED_HELP,
        msg('Details', {
          id: 'shell.notifications.unsupported-help',
          desc: 'Opens a list of browsers that support notifications.',
        }),
      );
    }
    return html`<p>${msg('Unknown error occurred', { id: 'shell.notifications.error' })}</p>`;
  }

  private renderPrompt(pending: boolean) {
    return html`
      <p>${msg('Enable notifications', { id: 'shell.notifications.prompt' })}</p>
      ${
        this.online
          ? nothing
          : html`<p class="offline">
              ${msg('Connect to the internet to turn on notifications.', {
                id: 'shell.notifications.offline',
              })}
            </p>`
      }
      <div class="panel-actions">
        <hb-button variant="text" ?disabled="${!this.online}" @click="${this.enable}">
          ${msg('Enable', { id: 'shell.notifications.enable' })}
        </hb-button>
      </div>
      ${pending ? msg('Loading...', { id: 'common.loading' }) : nothing}
    `;
  }

  private renderSwitches(token: string) {
    const general =
      this.notificationsSubscribers instanceof Success && !!this.notificationsSubscribers.data;
    return html`
      <p>
        ${msg('Get notified of general announcements and sessions starting', {
          id: 'shell.notifications.enabled',
        })}
      </p>
      <hb-switch
        class="switch-row"
        .checked="${general}"
        ?disabled="${!this.online}"
        @change="${(event: Event) => this.toggleGeneral(event, token)}"
        >${msg('General notifications', { id: 'shell.notifications.general' })}</hb-switch
      >
      ${
        this.online
          ? nothing
          : html`<p class="offline">
              ${msg('Connect to the internet to change general notifications.', {
                id: 'shell.notifications.general-offline',
              })}
            </p>`
      }

      <auth-required>
        <p slot="prompt">
          ${msg('Sign in to get personalized session notifications', {
            id: 'shell.notifications.sign-in',
          })}
        </p>
        <hb-switch
          class="switch-row"
          .checked="${this.notificationsUsersSubscribed}"
          @change="${(event: Event) => this.toggleMySchedule(event, token)}"
          >${msg('My Schedule notifications', {
            id: 'shell.notifications.my-schedule',
          })}</hb-switch
        >
      </auth-required>
    `;
  }

  private renderHelp(message: string, href: string, label: string) {
    return html`
      <p>${message}</p>
      <div class="panel-actions">
        <hb-button variant="text" href="${href}" target="_blank" @click="${this.close}">
          ${label}
        </hb-button>
      </div>
    `;
  }

  private readonly enable = () => {
    if (this.notificationPermission instanceof Initialized && this.online) {
      store.dispatch(requestNotificationPermission(PROMPT_USER.YES));
    }
    this.close();
  };

  private readonly close = () => {
    this.dispatchEvent(new Event('close'));
  };

  private toggleGeneral(event: Event, token: string) {
    const { checked, disabled } = event.target as HbSwitch;
    if (disabled) return;
    if (checked) {
      updateNotificationsSubscribers(token);
    } else {
      clearNotificationsSubscribers(token);
    }
  }

  private toggleMySchedule(event: Event, token: string) {
    const { checked } = event.target as HbSwitch;
    if (!(this.user instanceof Success)) return;
    if (checked) {
      updateNotificationsUsers(this.user.data.uid, token);
    } else {
      removeNotificationsUsers(this.user.data.uid, token);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'notification-settings': NotificationSettings;
  }
}
