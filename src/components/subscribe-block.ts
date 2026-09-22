import { Success } from '@abraham/remotedata';
import '@material/web/button/text-button.js';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DialogData } from '../models/dialog-form';
import { RootState, store } from '../store';
import { openSubscribeDialog } from '../store/dialogs/actions';
import { ReduxMixin } from '../store/mixin';
import { subscribe } from '../store/subscribe/actions';
import { initialSubscribeState, SubscribeState } from '../store/subscribe/state';
import { initialUiState } from '../store/ui/state';
import { initialUserState } from '../store/user/state';
import { subscribeBlock } from '../utils/data';
import './hoverboard-icon';
import { ThemedElement } from './themed-element';

@customElement('subscribe-block')
export class SubscribeBlock extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
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

        md-text-button {
          color: #fff;
          --md-text-button-label-text-color: #fff;
          --md-text-button-hover-label-text-color: #fff;
        }

        md-text-button[disabled] {
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
      `,
    ];
  }

  private subscribeBlock = subscribeBlock;

  @property({ type: Object })
  subscribed: SubscribeState = initialSubscribeState;

  @property({ type: Object })
  user = initialUserState;
  @property({ type: Object })
  viewport = initialUiState.viewport;

  override stateChanged(state: RootState) {
    this.subscribed = state.subscribed;
    this.user = state.user;
    this.viewport = state.ui.viewport;
  }

  private get ctaIcon() {
    return this.subscribed instanceof Success ? 'checked' : 'arrow-right-circle';
  }

  private get ctaLabel() {
    return this.subscribed instanceof Success
      ? this.subscribeBlock.subscribed
      : this.subscribeBlock.callToAction.label;
  }

  override render() {
    return html`
      <div class="container" layout vertical ?center="${this.viewport.isTabletPlus}">
        <div class="description">${this.subscribeBlock.callToAction.description}</div>
        <div class="cta-button">
          <md-text-button
            class="animated icon-right"
            trailing-icon
            ?disabled="${this.subscribed instanceof Success}"
            @click="${this.subscribe}"
          >
            <span class="cta-label">${this.ctaLabel}</span>
            <hoverboard-icon slot="icon" name="${this.ctaIcon}"></hoverboard-icon>
          </md-text-button>
        </div>
      </div>
    `;
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

declare global {
  interface HTMLElementTagNameMap {
    'subscribe-block': SubscribeBlock;
  }
}
