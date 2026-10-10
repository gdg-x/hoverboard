import { Failure, Initialized, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { store } from '../../store';
import {
  initialNotificationPermissionState,
  PROMPT_USER,
  requestNotificationPermission,
  unsupportedNotificationPermission,
} from '../../store/notification-permission';
import { selectOnline } from '../../store/sync';
import '../shared/hoverboard-icon';
import '../ui/hb-icon-button';
import '../ui/hb-popover';
import type { HbPopover } from '../ui/hb-popover';
import './notification-settings';
import { ThemedComponent } from '../themed-component';

/** The header's bell: its icon shows the browser's permission, and it opens the settings. */
@customElement('notification-toggle')
export class NotificationToggle extends ThemedComponent {
  @fromStore((state) => state.notificationPermission.value)
  private accessor notificationPermission!: typeof initialNotificationPermissionState.value;
  @fromStore(selectOnline)
  private accessor online!: boolean;

  @query('hb-popover')
  private accessor panel!: HbPopover | null;

  // After the first render, which must match the server's, where the permission is unknown. The
  // settings render it too, so they hydrate first.
  override async firstUpdated() {
    await this.renderRoot.querySelector('notification-settings')?.updateComplete;
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
      <hb-popover>
        <hb-icon-button
          slot="trigger"
          class="notifications-trigger"
          label="${msg('Notifications', { id: 'shell.notifications.toggle' })}"
          @click="${this.requestPermission}"
        >
          <hoverboard-icon name="${this.icon}"></hoverboard-icon>
        </hb-icon-button>
        <notification-settings @close="${this.close}"></notification-settings>
      </hb-popover>
    `;
  }

  // Opening the panel for the first time also asks the browser.
  private readonly requestPermission = () => {
    if (this.notificationPermission instanceof Initialized && this.online) {
      store.dispatch(requestNotificationPermission(PROMPT_USER.YES));
    }
  };

  private readonly close = () => {
    this.panel?.close();
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
}

declare global {
  interface HTMLElementTagNameMap {
    'notification-toggle': NotificationToggle;
  }
}
