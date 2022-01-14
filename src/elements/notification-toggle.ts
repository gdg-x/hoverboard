import { Initialized } from '@abraham/remotedata';
import { computed, customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState, store } from '../store';
import {
  initialNotificationPermissionState,
  requestNotificationPermission,
  unsupportedNotificationPermission,
  updateNotificationPermission,
} from '../store/notification-permission';
import { updateNotificationsSubscribers } from '../store/notifications-subscribers/actions';
import { initialNotificationsSubscribersState } from '../store/notifications-subscribers/state';
import './shared-styles';

@customElement('notification-toggle')
export class NotificationToggle extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
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
      </style>

      <paper-menu-button
        id="notificationsMenu"
        class="notifications-menu"
        vertical-align="top"
        horizontal-align="right"
        no-animations
        opened="{{opened}}"
      >
        <paper-icon-button icon="hoverboard:[[icon]]" slot="dropdown-trigger"></paper-icon-button>

        <div class="dropdown-panel" slot="dropdown-content">
          <template is="dom-if" if="[[initialized]]">
            <p>{$ notifications.default $}</p>
            <div class="panel-actions" layout horizontal end-justified>
              <paper-button primary-text on-click="requestPermission">
                {$ notifications.subscribe $}
              </paper-button>
            </div>
          </template>

          <template is="dom-if" if="[[pending]]">Loading...</template>

          <template is="dom-if" if="[[success]]">
            <p>{$ notifications.enabled $}</p>
            <div class="panel-actions" layout horizontal end-justified>
              <paper-button primary-text on-click="clearPermission">
                {$ notifications.unsubscribe $}
              </paper-button>
            </div>
          </template>

          <template is="dom-if" if="[[blocked]]">
            <p>{$ notifications.blocked.text $}</p>
            <div class="panel-actions" layout horizontal end-justified>
              <a href="{$ notifications.blocked.link $}" target="_blank" rel="noopener noreferrer">
                <paper-button primary-text on-click="close">
                  {$ notifications.blocked.label $}
                </paper-button>
              </a>
            </div>
          </template>

          <template is="dom-if" if="[[unsupported]]">
            <p>{$ notifications.unsupported.text $}</p>
            <div class="panel-actions" layout horizontal end-justified>
              <a
                href="{$ notifications.unsupported.link $}"
                target="_blank"
                rel="noopener noreferrer"
              >
                <paper-button primary-text on-click="close">
                  {$ notifications.unsupported.label $}
                </paper-button>
              </a>
            </div>
          </template>

          <template is="dom-if" if="[[failure]]">
            <p>{$ notifications.unknown.text $}</p>
          </template>
        </div>
      </paper-menu-button>
    `;
  }

  @property({ type: Object })
  notificationPermission = initialNotificationPermissionState;
  @property({ type: Object })
  notificationsSubscribers = initialNotificationsSubscribersState;

  @property({ type: Boolean })
  private opened = false;

  override connectedCallback() {
    super.connectedCallback();

    if ('Notification' in window && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' }).then((permission) => {
        store.dispatch(updateNotificationPermission());
        permission.onchange = () => store.dispatch(updateNotificationPermission());
      });
    } else {
      store.dispatch(unsupportedNotificationPermission());
    }
  }

  override stateChanged(state: RootState) {
    this.notificationPermission = state.notificationPermission;
    this.notificationsSubscribers = state.notificationsSubscribers;
    if (this.notificationPermission.kind === 'success' && this.opened) {
      this.opened = false;
    }
    if (
      this.notificationPermission.kind === 'success' &&
      this.notificationsSubscribers instanceof Initialized
    ) {
      store.dispatch(updateNotificationsSubscribers());
    }
  }

  @computed('notificationPermission')
  get initialized() {
    return (
      this.notificationPermission.kind === 'initialized' ||
      this.notificationPermission.kind === 'pending'
    );
  }

  @computed('notificationPermission')
  get blocked() {
    return (
      this.notificationPermission.kind === 'failure' &&
      this.notificationPermission.error.message === 'denied'
    );
  }

  @computed('notificationPermission')
  get unsupported() {
    return (
      this.notificationPermission.kind === 'failure' &&
      this.notificationPermission.error.message === 'unsupported'
    );
  }

  @computed('notificationPermission')
  get failure() {
    return (
      this.notificationPermission.kind === 'failure' &&
      this.notificationPermission.error.message !== 'denied' &&
      this.notificationPermission.error.message !== 'unsupported'
    );
  }

  @computed('notificationPermission')
  get success() {
    return this.notificationPermission.kind === 'success';
  }

  private requestPermission() {
    store.dispatch(requestNotificationPermission());
  }

  private clearPermission() {
    console.log('clearPermission');
    // TODO
    // clearNotificationPermission();
  }

  @computed('notificationPermission')
  get icon() {
    if (this.notificationPermission.kind === 'success') {
      return 'bell';
    } else if (this.notificationPermission.kind === 'failure') {
      return 'bell-off';
    } else {
      return 'bell-outline';
    }
  }

  private close() {
    this.opened = false;
  }
}
