import { Success } from '@abraham/remotedata';
import { computed, customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import { DialogData } from '../models/dialog-form';
import { RootState, store } from '../store';
import { openSubscribeDialog } from '../store/dialogs/actions';
import { ReduxMixin } from '../store/mixin';
import { subscribe } from '../store/subscribe/actions';
import { initialSubscribeState, SubscribeState } from '../store/subscribe/state';
import { initialUiState } from '../store/ui/state';
import { initialUserState } from '../store/user/state';
import { subscribeBlock } from '../utils/data';
import '../utils/icons';
import './shared-styles';

@customElement('subscribe-block')
export class SubscribeBlock extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: flex;
          width: 100%;
          background: var(--default-primary-color);
          color: #fff;
          padding: 16px 0;
        }

        .description {
          font-size: 24px;
          line-height: 1.5;
          margin: 0 0 16px;
        }

        paper-button {
          color: #fff;
        }

        paper-button[disabled] {
          background: var(--default-primary-color);
          color: #fff;
        }

        @media (min-width: 640px) {
          :host {
            padding: 32px 0;
          }

          .description {
            font-size: 32px;
            margin: 0 0 24px;
            text-align: center;
          }
        }
      </style>

      <div class="container" layout vertical center$="[[viewport.isTabletPlus]]">
        <div class="description">[[subscribeBlock.callToAction.description]]</div>
        <div class="cta-button">
          <paper-button
            class="animated icon-right"
            disabled$="[[subscribed.data]]"
            on-click="subscribe"
          >
            <span class="cta-label">[[ctaLabel]]</span>
            <iron-icon icon$="hoverboard:[[ctaIcon]]"></iron-icon>
          </paper-button>
        </div>
      </div>
    `;
  }

  private subscribeBlock = subscribeBlock;

  @property({ type: Object })
  subscribed: SubscribeState = initialSubscribeState;

  @property({ type: Object })
  private user = initialUserState;
  @property({ type: Object })
  private viewport = initialUiState.viewport;

  override stateChanged(state: RootState) {
    this.subscribed = state.subscribed;
    this.user = state.user;
    this.viewport = state.ui.viewport;
  }

  @computed('subscribed')
  private get ctaIcon() {
    return this.subscribed instanceof Success ? 'checked' : 'arrow-right-circle';
  }

  @computed('subscribed')
  private get ctaLabel() {
    return this.subscribed instanceof Success
      ? this.subscribeBlock.subscribed
      : this.subscribeBlock.callToAction.label;
  }

  private subscribe() {
    let userData = {
      firstFieldValue: '',
      secondFieldValue: '',
    };

    if (this.user instanceof Success) {
      const name = this.user.data.displayName?.split(' ') || ['', ''];
      userData = {
        firstFieldValue: name[0] || '',
        secondFieldValue: name[1] || '',
      };

      if (this.user.data.email) {
        this.subscribeAction({ ...userData, email: this.user.data.email });
      }
    }

    if (this.user instanceof Success && this.user.data.email) {
      this.subscribeAction({ ...userData, email: this.user.data.email });
    } else {
      openSubscribeDialog({
        title: this.subscribeBlock.formTitle,
        submitLabel: this.subscribeBlock.subscribe,
        firstFieldLabel: this.subscribeBlock.firstName,
        secondFieldLabel: this.subscribeBlock.lastName,
        firstFieldValue: userData.firstFieldValue,
        secondFieldValue: userData.secondFieldValue,
        submit: (data) => this.subscribeAction(data),
      });
    }
  }

  private subscribeAction(data: DialogData) {
    store.dispatch(subscribe(data));
  }
}
