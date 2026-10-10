import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { openSigninDialog } from '../../store/dialogs';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';

@customElement('auth-required')
export class AuthRequired extends ThemedComponent {
  @fromStore((state) => state.user instanceof Success)
  private accessor signedIn!: boolean;

  override render() {
    const signedIn = this.signedIn;
    return html`
      <hb-button variant="text" @click="${() => openSigninDialog()}" ?hidden="${signedIn}">
        ${msg('Sign in', { id: 'common.sign-in' })}
      </hb-button>
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
