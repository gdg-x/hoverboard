import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin.js';
import { dialogsActions } from '../redux/actions.js';
import { DIALOGS } from '../redux/constants.js';
import './shared-styles.js';

class AuthRequired extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
    <style include="shared-styles">
      :host {
        display: block;
      }
    </style>

    <paper-button on-tap="signIn" hidden$="[[user.signedIn]]">{$ signIn $}</paper-button>
    <slot name="prompt" hidden$="[[user.signedIn]]"></slot>
    <slot hidden$="[[!user.signedIn]]"></slot>
  `;
  }

  static get is() {
    return 'auth-required';
  }

  static get properties() {
    return {
      user: {
        type: Object,
        statePath: 'user',
      },
      dialogs: {
        type: Object,
        statePath: 'dialogs',
      },
    };
  }

  static get observers() {
    return [
      '_authStatusChanged(user.signedIn)',
    ];
  }

  signIn() {
    dialogsActions.openDialog(DIALOGS.SIGNIN);
  }

  _authStatusChanged(signedIn) {
    if (this.dialogs.signin.isOpened) {
      dialogsActions.closeDialog(DIALOGS.SIGNIN);
    }
  }
}

customElements.define(AuthRequired.is, AuthRequired);
