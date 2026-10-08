import { Failure, Initialized, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/outlined-text-field.js';
import { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field.js';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { subscribe, type SubscribeState } from '../../store/subscribe';
import '../shared/hoverboard-icon';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('subscribe-form-footer')
export class SubscribeFormFooter extends ThemedElement {
  static override styles = css`
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
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .submit-button {
      align-self: flex-end;
    }

    hoverboard-icon {
      margin-bottom: 5px;
    }
  `;

  @fromStore((state) => state.subscribed)
  accessor subscribed!: SubscribeState;

  @property()
  accessor email = '';

  @query('#emailInput')
  private accessor emailInput!: MdOutlinedTextField | null;

  override render() {
    return html`
      <div class="form-content">
        <md-outlined-text-field
          id="emailInput"
          type="email"
          label="${msg('Your email', { id: 'footer.subscribe-form.email' })}"
          .value="${this.email}"
          required
          ?error="${this.validate}"
          error-text="${msg('Please enter a valid email address.', { id: 'common.email-invalid' })}"
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
        <md-filled-button
          class="submit-button"
          ?disabled="${this.disabled}"
          @click="${this.subscribe}"
        >
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
      ? msg('Subscribed', { id: 'common.subscribed' })
      : msg('Subscribe', { id: 'common.subscribe', desc: 'Button that submits a subscription.' });
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
      subscribe({ email: this.email });
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'subscribe-form-footer': SubscribeFormFooter;
  }
}
