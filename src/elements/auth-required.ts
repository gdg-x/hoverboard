import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
import { dialogsActions } from '../redux/actions';
import { DIALOGS } from '../redux/constants';
import './shared-styles';

class AuthRequired extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles">
        :host {
          display: block;
        }
      </style>

      <paper-button on-click="signIn" hidden$="[[user.signedIn]]">{$ signIn $}</paper-button>
      <slot name="prompt" hidden$="[[user.signedIn]]"></slot>
      <slot hidden$="[[!user.signedIn]]"></slot>
    `;
  }

  static get is() {
    return 'auth-required';
  }

  private user: { signedIn?: boolean } = {};
  private dialogs = { signin: { isOpened: false } };

  static get properties() {
    return {
      user: Object,
      dialogs: Object,
    };
  }

  stateChanged(state: import('../redux/store').State) {
    this.setProperties({
      user: state.user,
      dialogs: state.dialogs,
    });
  }

  static get observers() {
    return ['_authStatusChanged(user.signedIn)'];
  }

  signIn() {
    dialogsActions.openDialog(DIALOGS.SIGNIN);
  }

  _authStatusChanged(_signedIn) {
    if (this.dialogs.signin.isOpened) {
      dialogsActions.closeDialog(DIALOGS.SIGNIN);
    }
  }
}

customElements.define(AuthRequired.is, AuthRequired);
