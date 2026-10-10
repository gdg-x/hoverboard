import { Failure, Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { EmailAuthProvider } from 'firebase/auth';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
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
import { selectOnline } from '../../store/sync';
import { emailLinkSignIn, signInProviders } from '../../config/site';
import { getProviderCompanyName, PROVIDER } from '../../utils/providers';
import { illustration, illustrationStyles } from '../../illustrations/illustration';
import signInArt from '../../illustrations/sign-in.svg?raw';
import '../shared/hoverboard-icon';
import '../ui/hb-button';
import '../ui/hb-dialog';
import './email-link-form';
import type { EmailLinkForm } from './email-link-form';
import { ThemedComponent } from '../themed-component';

const signInWith = (provider: string) =>
  msg(str`Sign in with ${provider}`, { id: 'dialogs.signin.sign-in-with' });
const generalError = () =>
  msg('An error has occurred. Please, try again later.', { id: 'common.general-error' });

@customElement('signin-dialog')
export class SigninDialog extends ThemedComponent {
  static override styles = [
    illustrationStyles,
    css`
      .illustration {
        inline-size: min(100%, 12rem);
        margin: 0 auto var(--hb-space-4);
      }

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

      .or {
        margin: var(--hb-space-4) 0 0;
        color: var(--hb-color-on-surface-variant);
        text-align: center;
      }

      .offline {
        margin: 0 0 var(--hb-space-4);
        font-weight: 600;
      }
    `,
  ];

  private signInProviders = signInProviders;

  @fromStore((state) => state.auth)
  private accessor auth!: typeof initialAuthState;
  @state()
  private accessor isMergeState = false;
  @fromStore((state) => selectIsDialogOpen(state, DIALOG.SIGNIN))
  private accessor open!: boolean;
  @fromStore(selectOnline)
  private accessor online!: boolean;
  @state()
  private accessor email = '';
  @state()
  private accessor providerCompanyName = '';

  @query('email-link-form')
  private accessor emailLinkForm!: EmailLinkForm | null;

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
      // A link account can't be merged in a popup, because its link opens another page.
      if ((error.providerId as string) === EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD) {
        store.dispatch(
          queueSnackbar(
            msg(str`${error.email} signed in with an email link before. Sign in that way.`, {
              id: 'dialogs.signin.use-email-link',
            }),
          ),
        );
        return;
      }
      this.email = error.email;
      this.providerCompanyName = getProviderCompanyName(error.providerId);
      openSigninDialog();
    }
  }

  // Each time it opens, the dialog starts again at the email field.
  override willUpdate(changed: PropertyValues) {
    if (changed.has('open') && this.open) {
      this.emailLinkForm?.reset();
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
          this.online
            ? nothing
            : html`<p class="offline" role="status">
                ${msg('Connect to the internet to sign in.', { id: 'dialogs.signin.offline' })}
              </p>`
        }
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
                    <hb-button
                      variant="text"
                      class="merge-button"
                      ?disabled="${!this.online}"
                      @click="${this.mergeAccounts}"
                    >
                      ${signInWith(provider)}
                    </hb-button>
                  </div>
                </div>
              `
            : html`
                <div>
                  ${illustration(signInArt)}
                  ${
                    emailLinkSignIn
                      ? html`<email-link-form class="email-link"></email-link-form>`
                      : nothing
                  }
                  ${
                    emailLinkSignIn && this.signInProviders.providersData.length
                      ? html`<p class="or">
                          ${msg('or', {
                            id: 'dialogs.signin.or',
                            desc: 'Between signing in by email and signing in with another account.',
                          })}
                        </p>`
                      : nothing
                  }
                  ${this.signInProviders.providersData.map(
                    (provider) => html`
                      <hb-button
                        variant="text"
                        class="sign-in-button"
                        ?disabled="${!this.online}"
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
