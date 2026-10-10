import { Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { signOut } from '../../store/auth';
import { openProfileDialog, openSigninDialog } from '../../store/dialogs';
import type { UserState } from '../../store/user';
import '../shared/hoverboard-icon';
import '../ui/hb-icon-button';
import '../ui/hb-menu';
import { ThemedComponent } from '../themed-component';
import { navigationLabel } from './navigation-label';

/** Sign in, or the signed-in visitor's menu. The header shows it when a feature needs sign-in. */
@customElement('account-menu')
export class AccountMenu extends ThemedComponent {
  static override styles = css`
    :host {
      display: inline-flex;
    }

    .avatar {
      inline-size: 32px;
      block-size: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .profile {
      display: grid;
      padding: var(--hb-space-2) var(--hb-space-4) var(--hb-space-3);
      border-block-end: 1px solid var(--hb-color-outline-variant);
      margin-block-end: var(--hb-space-2);
    }

    .name {
      font-weight: 600;
    }

    .email {
      color: var(--hb-color-on-surface-variant);
      font-size: var(--hb-text-sm);
    }
  `;

  @fromStore((state) => state.user)
  private accessor user!: UserState;

  override render() {
    if (!(this.user instanceof Success)) {
      return html`
        <hb-icon-button label="${msg('Sign in', { id: 'common.sign-in' })}" @click="${this.signIn}">
          <hoverboard-icon name="account"></hoverboard-icon>
        </hb-icon-button>
      `;
    }

    const { displayName, email, photoURL } = this.user.data;
    const name = displayName || email || '';
    return html`
      <hb-menu>
        <hb-icon-button
          slot="trigger"
          label="${msg(str`Account of ${name}`, { id: 'shell.account-menu.label' })}"
        >
          ${
            photoURL
              ? html`<img class="avatar" src="${photoURL}" alt="" referrerpolicy="no-referrer" />`
              : html`<hoverboard-icon name="account"></hoverboard-icon>`
          }
        </hb-icon-button>
        <div class="profile" role="presentation">
          <span class="name">${displayName}</span>
          <span class="email">${email}</span>
        </div>
        ${
          __HB_FEATURES__.mySchedule
            ? html`<a role="menuitem" href="/schedule/my-schedule"
                >${navigationLabel('mySchedule')}</a
              >`
            : nothing
        }
        ${
          __HB_FEATURES__.reactions
            ? html`<button role="menuitem" type="button" @click="${this.editProfile}">
                ${msg('Public profile', { id: 'shell.account-menu.profile' })}
              </button>`
            : nothing
        }
        <button role="menuitem" type="button" @click="${this.signOut}">
          ${msg('Sign out', { id: 'shell.header.sign-out' })}
        </button>
      </hb-menu>
    `;
  }

  private readonly signIn = () => {
    openSigninDialog();
  };

  private readonly editProfile = () => {
    openProfileDialog();
  };

  private readonly signOut = () => {
    signOut();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'account-menu': AccountMenu;
  }
}
