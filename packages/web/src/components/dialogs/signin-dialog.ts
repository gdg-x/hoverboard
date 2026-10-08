import { Failure, Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { StoreController } from '../../controllers/store-controller';
import { fromStore } from '../../controllers/from-store';
import { store } from '../../store';
import {
  type ExistingAccountError,
  initialAuthState,
  mergeAccounts,
  selectAuthMergeable,
  signIn,
} from '../../store/auth';
import { closeDialog, DIALOG, openSigninDialog, selectIsDialogOpen } from '../../store/dialogs';
import { queueSnackbar } from '../../store/snackbars';
import { signInProviders } from '../../config/site';
import { getProviderCompanyName, PROVIDER } from '../../utils/providers';
import '../shared/hoverboard-icon';
import '../ui/hb-button';
import '../ui/hb-dialog';
import { ThemedElement } from '../themed-element';

const signInWith = (provider: string) =>
  msg(str`Sign in with ${provider}`, { id: 'dialogs.signin.sign-in-with' });
const generalError = () =>
  msg('An error has occurred. Please, try again later.', { id: 'common.general-error' });

@customElement('signin-dialog')
export class SigninDialog extends ThemedElement {
  static override styles = css`
    .sign-in-button {
      --hb-button-color: var(--hb-color-on-surface);

      margin: 16px 0;
      display: flex;
    }

    .merge-content .subtitle,
    .merge-content .explanation {
      margin-bottom: 16px;
    }

    .action-button {
      display: flex;
      justify-content: flex-end;
    }

    hoverboard-icon.icon-twitter {
      color: var(--twitter-color);
    }

    hoverboard-icon.icon-facebook {
      color: var(--facebook-color);
    }
  `;

  private signInProviders = signInProviders;

  @fromStore((state) => state.auth)
  private accessor auth!: typeof initialAuthState;
  @state()
  private accessor isMergeState = false;
  @fromStore((state) => selectIsDialogOpen(state, DIALOG.SIGNIN))
  private accessor open!: boolean;
  @state()
  private accessor email = '';
  @state()
  private accessor providerCompanyName = '';

  private readonly mergeStore = new StoreController(this, selectAuthMergeable, {
    onChange: (value) => {
      const wasMergeState = this.isMergeState;
      this.isMergeState = value;
      if (value !== wasMergeState) {
        this.onIsMergeState();
      }
    },
  });

  private readonly signedInStore = new StoreController(
    this,
    (state) => state.user instanceof Success,
    {
      onChange: (signedIn) => {
        if (signedIn && this.open) closeDialog();
      },
    },
  );

  private onIsMergeState() {
    closeDialog();
    if (this.isMergeState && this.auth instanceof Failure) {
      const error: ExistingAccountError = this.auth.error;
      if (!error.email || !error.providerId) {
        store.dispatch(queueSnackbar(generalError()));
        return;
      }
      this.email = error.email;
      this.providerCompanyName = getProviderCompanyName(error.providerId);
      openSigninDialog();
    }
  }

  override render() {
    const { email } = this;
    const provider = this.providerCompanyName;
    return html`
      <hb-dialog
        heading="${msg('Sign in', { id: 'common.sign-in' })}"
        ?open="${this.open}"
        @close="${() => closeDialog()}"
      >
        ${
          this.isMergeState
            ? html`
                <div class="merge-content">
                  <h3 class="subtitle">
                    ${msg('You already have an account', {
                      id: 'dialogs.signin.existing-account',
                    })}
                  </h3>
                  <div class="explanation">
                    <div class="row-1">
                      ${msg(html`You've already used <b>${email}</b>.`, {
                        id: 'dialogs.signin.existing-email',
                      })}
                    </div>
                    <div class="row-2">
                      ${msg(str`Sign in with ${provider} to continue.`, {
                        id: 'dialogs.signin.continue-with',
                      })}
                    </div>
                  </div>

                  <div class="action-button">
                    <hb-button variant="text" class="merge-button" @click="${this.mergeAccounts}">
                      ${signInWith(provider)}
                    </hb-button>
                  </div>
                </div>
              `
            : html`
                <div>
                  ${this.signInProviders.providersData.map(
                    (provider) => html`
                      <hb-button
                        variant="text"
                        class="sign-in-button"
                        @click="${() => this.signIn(provider.url as PROVIDER)}"
                      >
                        <hoverboard-icon
                          slot="icon"
                          name="${provider.name}"
                          class="icon-${provider.name}"
                        ></hoverboard-icon>
                        ${signInWith(provider.label)}
                      </hb-button>
                    `,
                  )}
                </div>
              `
        }
      </hb-dialog>
    `;
  }

  private mergeAccounts = () => {
    if (this.auth instanceof Failure) {
      const error: ExistingAccountError = this.auth.error;
      if (error.providerId && error.credential) {
        mergeAccounts(error.providerId, error.credential);
        closeDialog();
      }
    }
  };

  private signIn(providerUrl: PROVIDER) {
    signIn(providerUrl);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'signin-dialog': SigninDialog;
  }
}
