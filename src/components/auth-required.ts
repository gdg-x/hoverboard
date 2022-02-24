import { Success } from '@abraham/remotedata';
import '@material/mwc-button';
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
      <mwc-button
        label="${signIn}"
        @click="${() => openSigninDialog()}"
        ?hidden="${this.signedIn}"
        dense
      ></mwc-button>
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
