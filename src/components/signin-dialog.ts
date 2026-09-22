import { Failure } from '@abraham/remotedata';
import '@material/web/button/text-button.js';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { RootState } from '../store';
import { mergeAccounts, signIn } from '../store/auth/actions';
import { selectAuthMergeable } from '../store/auth/selectors';
import { initialAuthState } from '../store/auth/state';
import { ExistingAccountError } from '../store/auth/types';
import { closeDialog, openSigninDialog } from '../store/dialogs/actions';
import { selectIsDialogOpen } from '../store/dialogs/selectors';
import { DIALOG } from '../store/dialogs/types';
import { ReduxMixin } from '../store/mixin';
import { TempAny } from '../temp-any';
import { signIn as signInText, signInDialog, signInProviders } from '../utils/data';
import { getProviderCompanyName, PROVIDER } from '../utils/providers';
import './hoverboard-icon';
import { HoverboardDialog } from './hoverboard-dialog';
import './hoverboard-dialog';
import { ThemedElement } from './themed-element';

@customElement('signin-dialog')
export class SigninDialog extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          --mdc-theme-primary: var(--primary-text-color);
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

        hoverboard-icon.icon-twitter {
          color: var(--twitter-color);
        }

        hoverboard-icon.icon-facebook {
          color: var(--facebook-color);
        }
      `,
    ];
  }

  private signInProviders = signInProviders;
  private signInDialog = signInDialog;
  private signInText = signInText;

  @query('#dialog')
  dialog!: HoverboardDialog;

  @state()
  private auth = initialAuthState;
  @state()
  private isMergeState = false;
  @state()
  private open = false;
  @state()
  private email = '';
  @state()
  private providerCompanyName = '';

  override firstUpdated() {
    this.dialog.addEventListener('closed', () => closeDialog());
  }

  override stateChanged(state: RootState) {
    const wasMergeState = this.isMergeState;
    this.auth = state.auth;
    this.isMergeState = selectAuthMergeable(state);
    this.open = selectIsDialogOpen(state, DIALOG.SIGNIN);

    if (this.isMergeState !== wasMergeState) {
      this.onIsMergeState();
    }
  }

  private onIsMergeState() {
    closeDialog();
    if (this.isMergeState && this.auth instanceof Failure) {
      const error: ExistingAccountError = this.auth.error;
      if (!error.email || !error.providerId) {
        // TODO: Improve error handling
        return;
      }
      this.email = error.email;
      this.providerCompanyName = error.providerId && getProviderCompanyName(error.providerId);
      openSigninDialog();
    }
  }

  override render() {
    return html`
      <hoverboard-dialog id="dialog" ?open="${this.open}">
        <div slot="headline">${this.signInText}</div>
        <div slot="content">
          ${
            this.isMergeState
              ? html`
                  <div class="merge-content">
                    <h3 class="subtitle">${this.signInDialog.alreadyHaveAccount}</h3>
                    <div class="explanation">
                      <div class="row-1">
                        ${this.signInDialog.alreadyUsed} <b>${this.email}</b>.
                      </div>
                      <div class="row-2">
                        ${this.signInDialog.signInToContinue.part1} ${this.providerCompanyName}
                        ${this.signInDialog.signInToContinue.part2}
                      </div>
                    </div>

                    <div class="action-button" layout horizontal end-justified>
                      <md-text-button class="merge-button" @click="${this.mergeAccounts}">
                        <span
                          >${this.signInDialog.signInToContinue.part1}
                          ${this.providerCompanyName}</span
                        >
                      </md-text-button>
                    </div>
                  </div>
                `
              : html`
                  <div>
                    ${this.signInProviders.providersData.map(
                      (provider) => html`
                        <md-text-button
                          class="sign-in-button"
                          flex
                          @click="${() => this.signIn(provider.url as PROVIDER)}"
                        >
                          <hoverboard-icon
                            name="${provider.name}"
                            class="icon-${provider.name}"
                          ></hoverboard-icon>
                          <span>${provider.label}</span>
                        </md-text-button>
                      `,
                    )}
                  </div>
                `
          }
        </div>

        <md-text-button slot="actions" @click="${this.close}">Close</md-text-button>
      </hoverboard-dialog>
    `;
  }

  private close() {
    this.dialog.close();
  }

  private mergeAccounts() {
    if (this.auth instanceof Failure) {
      const error: ExistingAccountError = this.auth.error;
      mergeAccounts(error.providerId as TempAny, error.credential as TempAny);
      closeDialog();
    }
  }

  private signIn(providerUrl: PROVIDER) {
    signIn(providerUrl);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'signin-dialog': SigninDialog;
  }
}
