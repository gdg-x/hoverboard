import { Success } from '@abraham/remotedata';
import '@material/web/button/text-button.js';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { openSigninDialog } from '../../store/dialogs';
import { signIn } from '../../config/site';
import { ThemedElement } from '../themed-element';

@customElement('auth-required')
export class AuthRequired extends ThemedElement {
  @fromStore((state) => state.user instanceof Success)
  private accessor signedIn!: boolean;

  override render() {
    const signedIn = this.signedIn;
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
