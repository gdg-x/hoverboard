import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { finishSignInWithLink, hasSignInLink, sendSignInLink } from '../../store/auth';
import { selectOnline } from '../../store/sync';
import '../ui/hb-button';
import '../ui/hb-text-field';
import type { HbTextField } from '../ui/hb-text-field';
import { ThemedComponent } from '../themed-component';

/**
 * Signs in by email: it sends a link to the address, or, on a page opened from a link in a browser
 * that doesn't know the address, asks for it again to finish signing in.
 */
@customElement('email-link-form')
export class EmailLinkForm extends ThemedComponent {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--hb-space-3);
    }

    p {
      margin: 0;
    }
  `;

  @fromStore(selectOnline)
  private accessor online!: boolean;
  @state()
  private accessor email = '';
  @state()
  private accessor error = '';
  @state()
  private accessor linkSentTo = '';
  @state()
  private accessor sending = false;

  @query('hb-text-field')
  private accessor field!: HbTextField | null;

  /** Back to the email field, keeping what was typed. */
  reset() {
    this.linkSentTo = '';
    this.error = '';
  }

  override render() {
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
    const confirming = hasSignInLink();
    return html`
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
        .value="${this.email}"
        error="${this.error}"
        @input="${this.onInput}"
        @keydown="${this.onKeydown}"
      ></hb-text-field>
      <hb-button
        class="email-button"
        ?disabled="${this.sending || !this.online}"
        @click="${this.submit}"
      >
        ${
          confirming
            ? msg('Sign in', { id: 'common.sign-in' })
            : msg('Email me a sign-in link', { id: 'dialogs.signin.send-link' })
        }
      </hb-button>
    `;
  }

  private readonly onInput = (event: Event) => {
    this.email = (event.target as HbTextField).value;
  };

  // The field's input is in its own shadow root, with no form to submit on Enter.
  private readonly onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.submit();
    }
  };

  private readonly submit = async () => {
    if (this.sending || !this.online || !this.field?.reportValidity()) return;
    const email = this.email;
    this.sending = true;
    this.error = '';
    try {
      if (hasSignInLink()) {
        // Signing in closes the dialog. Other errors show a message and leave the email form.
        if ((await finishSignInWithLink(email)) === 'wrong-email') {
          this.error = msg('Use the email address the link was sent to.', {
            id: 'dialogs.signin.wrong-email',
          });
        }
      } else {
        await sendSignInLink(email);
        this.linkSentTo = email;
      }
    } catch {
      this.error = msg('Could not send the link. Please try again.', {
        id: 'dialogs.signin.send-error',
      });
    } finally {
      this.sending = false;
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'email-link-form': EmailLinkForm;
  }
}
