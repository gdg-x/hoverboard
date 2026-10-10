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
  finishSignInWithLink,
  hasSignInLink,
  initialAuthState,
  mergeAccounts,
  selectAuthMergeable,
  sendSignInLink,
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
import '../ui/hb-text-field';
import type { HbTextField } from '../ui/hb-text-field';
import { ThemedElement } from '../themed-element';

const signInWith = (provider: string) =>
  msg(str`Sign in with ${provider}`, { id: 'dialogs.signin.sign-in-with' });
const generalError = () =>
  msg('An error has occurred. Please, try again later.', { id: 'common.general-error' });

@customElement('signin-dialog')
export class SigninDialog extends ThemedElement {
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

      .email-link {
        display: flex;
        flex-direction: column;
        gap: var(--hb-space-3);
      }

      .email-link p,
      .or {
        margin: 0;
      }

      .or {
        margin-block-start: var(--hb-space-4);
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
  @state()
  private accessor emailInput = '';
  @state()
  private accessor emailError = '';
  @state()
  private accessor linkSentTo = '';
  @state()
  private accessor sending = false;

  @query('hb-text-field')
  private accessor emailField!: HbTextField | null;

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
      this.linkSentTo = '';
      this.emailError = '';
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
                  ${illustration(signInArt)} ${emailLinkSignIn ? this.renderEmailLink() : nothing}
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

  private renderEmailLink() {
    if (this.linkSentTo) {
      const email = this.linkSentTo;
      return html`
        <p class="link-sent" role="status">
          ${msg(html`Check your email. We sent a sign-in link to <b>${email}</b>.`, {
            id: 'dialogs.signin.link-sent',
          })}
        </p>
      `;
    }
    // The page was opened from a link, in a browser that doesn't know the address it went to.
    const confirming = hasSignInLink();
    return html`
      <div class="email-link">
        ${
          confirming
            ? html`<p>
                ${msg('Enter your email address again to finish signing in.', {
                  id: 'dialogs.signin.confirm-email',
                })}
              </p>`
            : nothing
        }
        <hb-text-field
          type="email"
          name="email"
          autocomplete="email"
          required
          label="${msg('Email', { id: 'dialogs.signin.email' })}"
          .value="${this.emailInput}"
          error="${this.emailError}"
          @input="${this.onEmailInput}"
          @keydown="${this.onEmailKeydown}"
        ></hb-text-field>
        <hb-button
          class="email-button"
          ?disabled="${this.sending || !this.online}"
          @click="${this.submitEmail}"
        >
          ${
            confirming
              ? msg('Sign in', { id: 'common.sign-in' })
              : msg('Email me a sign-in link', { id: 'dialogs.signin.send-link' })
          }
        </hb-button>
      </div>
    `;
  }

  private readonly onEmailInput = (event: Event) => {
    this.emailInput = (event.target as HbTextField).value;
  };

  // The field's input is in its own shadow root, with no form to submit on Enter.
  private readonly onEmailKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.submitEmail();
    }
  };

  private readonly submitEmail = async () => {
    if (this.sending || !this.online || !this.emailField?.reportValidity()) return;
    const email = this.emailInput;
    this.sending = true;
    this.emailError = '';
    try {
      if (hasSignInLink()) {
        // Signing in closes the dialog. Other errors show a message and leave the email form.
        if ((await finishSignInWithLink(email)) === 'wrong-email') {
          this.emailError = msg('Use the email address the link was sent to.', {
            id: 'dialogs.signin.wrong-email',
          });
        }
      } else {
        await sendSignInLink(email);
        this.linkSentTo = email;
      }
    } catch {
      this.emailError = msg('Could not send the link. Please try again.', {
        id: 'dialogs.signin.send-error',
      });
    } finally {
      this.sending = false;
    }
  };

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
