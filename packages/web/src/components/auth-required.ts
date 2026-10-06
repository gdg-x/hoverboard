import { Success } from '@abraham/remotedata';
import '@material/web/button/text-button.js';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { StoreController } from '../controllers/store-controller';
import { openSigninDialog } from '../store/dialogs';
import { signIn } from '../utils/data';
import { ThemedElement } from './themed-element';

@customElement('auth-required')
export class AuthRequired extends ThemedElement {
  private readonly signedInState = new StoreController(
    this,
    (state) => state.user instanceof Success,
  );

  override render() {
    const signedIn = this.signedInState.value;
    return html`
      <md-text-button @click="${() => openSigninDialog()}" ?hidden="${signedIn}">
        ${signIn}
      </md-text-button>
      <slot name="prompt" ?hidden="${signedIn}"></slot>
      <slot ?hidden="${!signedIn}"></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-required': AuthRequired;
  }
}
