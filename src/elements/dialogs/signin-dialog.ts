import { Failure } from '@abraham/remotedata';
import '@polymer/iron-icon';
import { IronOverlayBehavior } from '@polymer/iron-overlay-behavior';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class';
import { RootState } from '../../store';
import { mergeAccounts, signIn } from '../../store/auth/actions';
import { selectAuthMergeable } from '../../store/auth/selectors';
import { initialAuthState } from '../../store/auth/state';
import { ExistingAccountError } from '../../store/auth/types';
import { closeDialog, openDialog } from '../../store/dialogs/actions';
import { DIALOG } from '../../store/dialogs/types';
import { ReduxMixin } from '../../store/mixin';
import { initialUserState } from '../../store/user/state';
import { TempAny } from '../../temp-any';
import { signInDialog, signInProviders } from '../../utils/data';
import { getProviderCompanyName, PROVIDER } from '../../utils/providers';
import '../hoverboard-icons';
import '../shared-styles';

class SigninDialog extends ReduxMixin(mixinBehaviors([IronOverlayBehavior], PolymerElement)) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          margin: 0 auto;
          display: block;
          padding: 24px 32px;
          background: var(--primary-background-color);
          box-shadow: var(--box-shadow);
        }

        .dialog-content {
          margin: 0 auto;
        }

        .sign-in-button {
          margin: 16px 0;
          display: block;
          color: var(--primary-text-color);
        }

        .merge-content .subtitle,
        .merge-content .explanation {
          margin-bottom: 16px;
        }

        .icon-twitter {
          color: var(--twitter-color);
        }

        .icon-facebook {
          color: var(--facebook-color);
        }
      </style>

      <div class="dialog-content">
        <div class="initial-signin" hidden$="[[isMergeState]]">
          <template is="dom-repeat" items="[[signInProviders.providersData]]" as="provider">
            <paper-button
              class="sign-in-button"
              on-click="_signIn"
              provider-url="[[provider.url]]"
              flex
            >
              <iron-icon
                class="icon-[[provider.name]]"
                icon="hoverboard:[[provider.name]]"
              ></iron-icon>
              <span provider-url$="[[provider.url]]">[[provider.label]]</span>
            </paper-button>
          </template>
        </div>
        <div class="merge-content" hidden$="[[!isMergeState]]">
          <h3 class="subtitle">[[signInDialog.alreadyHaveAccount]]</h3>
          <div class="explanation">
            <div class="row-1">[[signInDialog.alreadyUsed]] <b>[[email]]</b>.</div>
            <div class="row-2">
              [[signInDialog.signInToContinue.part1]] [[providerCompanyName]]
              [[signInDialog.signInToContinue.part2]]
            </div>
          </div>

          <div class="action-button" layout horizontal end-justified>
            <paper-button class="merge-button" on-click="_mergeAccounts" primary>
              <span>[[signInDialog.signInToContinue.part1]] [[providerCompanyName]]</span>
            </paper-button>
          </div>
        </div>
      </div>
    `;
  }

  static get is() {
    return 'signin-dialog';
  }

  static get properties() {
    return {
      user: {
        type: Object,
        value: () => initialUserState,
      },
      auth: {
        type: Object,
        value: () => initialAuthState,
      },
      isMergeState: {
        type: Boolean,
        value: false,
      },
      email: String,
      providerCompanyName: String,
    };
  }

  private signInProviders = signInProviders;
  private signInDialog = signInDialog;

  stateChanged(state: RootState) {
    this.setProperties({
      user: state.user,
      auth: state.auth,
      isMergeState: selectAuthMergeable(state),
    });
  }

  constructor() {
    super();
    this.addEventListener('iron-overlay-canceled', this._close);
  }

  static get observers() {
    return ['_authChanged(isMergeState)'];
  }

  _authChanged(isMergeState: boolean) {
    closeDialog();
    if (isMergeState && this.auth instanceof Failure) {
      const error: ExistingAccountError = this.auth.error;
      this.email = error.email;
      this.providerCompanyName = error.providerId && getProviderCompanyName(error.providerId);
      openDialog(DIALOG.SIGNIN);
    }
  }

  _mergeAccounts() {
    if (this.auth instanceof Failure) {
      const error: ExistingAccountError = this.auth.error;
      mergeAccounts(error.providerId as TempAny, error.credential as TempAny);
      closeDialog();
    }
  }

  _close() {
    closeDialog();
  }

  _signIn(event: MouseEvent) {
    if (event.target instanceof Element) {
      const providerUrl = event.target.getAttribute('provider-url') as PROVIDER;
      signIn(providerUrl);
    } else {
      throw new Error('Error starting sign in');
    }
  }
}

window.customElements.define(SigninDialog.is, SigninDialog);
