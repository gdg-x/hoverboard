import { Failure, Initialized, Success } from '@abraham/remotedata';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field.js';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { RootState, store } from '../store';
import { ReduxMixin } from '../store/mixin';
import { subscribe } from '../store/subscribe/actions';
import { initialSubscribeState, SubscribeState } from '../store/subscribe/state';
import { subscribeBlock } from '../utils/data';
import { ThemedElement } from './themed-element';
import './hoverboard-icon';

@customElement('subscribe-form-footer')
export class SubscribeFormFooter extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          --md-outlined-text-field-label-text-color: var(--footer-text-color);
          --md-outlined-text-field-focus-label-text-color: var(--default-primary-color);
          --md-outlined-text-field-input-text-color: var(--footer-text-color);
        }

        md-outlined-text-field,
        .form-content {
          width: 100%;
        }

        .form-content {
          gap: 16px;
        }

        hoverboard-icon {
          margin-bottom: 5px;
        }
      `,
    ];
  }

  @property({ type: Object })
  subscribed: SubscribeState = initialSubscribeState;

  @property()
  email = '';

  @query('#emailInput')
  private emailInput?: MdOutlinedTextField;

  override stateChanged(state: RootState) {
    this.subscribed = state.subscribed;
  }

  override render() {
    return html`
      <div class="form-content" layout vertical center>
        <md-outlined-text-field
          id="emailInput"
          type="email"
          label="${subscribeBlock.yourEmail}"
          .value="${this.email}"
          required
          ?error="${this.validate}"
          error-text="${subscribeBlock.emailRequired}"
          autocomplete="off"
          ?disabled="${this.subscribed instanceof Success}"
          @input="${this.onEmailChanged}"
        >
          ${
            this.subscribed instanceof Success
              ? html`<hoverboard-icon slot="suffix" name="checked"></hoverboard-icon>`
              : ''
          }
        </md-outlined-text-field>
        <md-filled-button ?disabled="${this.disabled}" layout self-end @click="${this.subscribe}">
          ${this.ctaLabel}
        </md-filled-button>
      </div>
    `;
  }

  private get validate() {
    return this.subscribed instanceof Failure;
  }

  private get ctaLabel() {
    return this.subscribed instanceof Success
      ? subscribeBlock.subscribed
      : subscribeBlock.subscribe;
  }

  private get disabled() {
    return !this.email || this.subscribed instanceof Success;
  }

  private get initialized() {
    return this.subscribed instanceof Initialized;
  }

  private onEmailChanged = (event: Event) => {
    this.email = (event.target as MdOutlinedTextField).value;
  };

  private subscribe = () => {
    if (this.initialized && this.emailInput?.reportValidity()) {
      store.dispatch(subscribe({ email: this.email }));
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'subscribe-form-footer': SubscribeFormFooter;
  }
}
