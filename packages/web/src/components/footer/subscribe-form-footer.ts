import { Failure, Initialized, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { subscribe, type SubscribeState } from '../../store/subscribe';
import '../shared/hoverboard-icon';
import '../ui/hb-button';
import '../ui/hb-text-field';
import type { HbTextField } from '../ui/hb-text-field';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('subscribe-form-footer')
export class SubscribeFormFooter extends ThemedElement {
  static override styles = css`
    hb-text-field,
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
  private accessor emailInput!: HbTextField | null;

  override render() {
    return html`
      <div class="form-content">
        <hb-text-field
          id="emailInput"
          type="email"
          label="${msg('Your email', { id: 'footer.subscribe-form.email' })}"
          .value="${this.email}"
          required
          error="${
            this.validate
              ? msg('Please enter a valid email address.', { id: 'common.email-invalid' })
              : ''
          }"
          autocomplete="email"
          ?disabled="${this.subscribed instanceof Success}"
          @input="${this.onEmailChanged}"
        >
          ${
            this.subscribed instanceof Success
              ? html`<hoverboard-icon slot="suffix" name="checked"></hoverboard-icon>`
              : ''
          }
        </hb-text-field>
        <hb-button class="submit-button" ?disabled="${this.disabled}" @click="${this.subscribe}">
          ${this.ctaLabel}
        </hb-button>
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
    this.email = (event.target as HbTextField).value;
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
