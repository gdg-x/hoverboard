import { Success } from '@abraham/remotedata';
import '@material/web/button/text-button.js';
import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { RootState } from '../store';
import { openSigninDialog } from '../store/dialogs/actions';
import { ReduxMixin } from '../store/mixin';
import { signIn } from '../utils/data';
import { ThemedElement } from './themed-element';

@customElement('auth-required')
export class AuthRequired extends ReduxMixin(ThemedElement) {
  @state()
  private signedIn = false;

  override render() {
    return html`
      <md-text-button
        @click="${() => openSigninDialog()}"
        ?hidden="${this.signedIn}"
      >
        ${signIn}
      </md-text-button>
      <slot name="prompt" ?hidden="${this.signedIn}"></slot>
      <slot ?hidden="${!this.signedIn}"></slot>
    `;
  }

  override stateChanged(state: RootState) {
    this.signedIn = state.user instanceof Success;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'auth-required': AuthRequired;
  }
}
