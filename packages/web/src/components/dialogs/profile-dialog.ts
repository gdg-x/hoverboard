import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { store } from '../../store';
import {
  closeDialog,
  DIALOG,
  selectIsDialogOpen,
  selectProfileDialogReaction,
} from '../../store/dialogs';
import {
  deleteOwnProfile,
  type ProfilesState,
  selectOwnProfileState,
  setOwnProfile,
} from '../../store/profiles';
import {
  type ReactionsState,
  selectOwnReactionsState,
  selectOwnSessionReactions,
  setUserReactions,
  toggled,
} from '../../store/reactions';
import { queueSnackbar } from '../../store/snackbars';
import type { UserState } from '../../store/user';
import { notEmpty } from '../../utils/strings';
import '../ui/hb-button';
import '../ui/hb-dialog';
import type { HbDialog } from '../ui/hb-dialog';
import '../ui/hb-switch';
import type { HbSwitch } from '../ui/hb-switch';
import '../ui/hb-text-field';
import type { HbTextField } from '../ui/hb-text-field';
import { ThemedComponent } from '../themed-component';

/**
 * The name and photo others see with the visitor's reactions. It starts from the name and photo of
 * their sign-in provider, and can delete the profile with their reactions.
 */
@customElement('profile-dialog')
export class ProfileDialog extends ThemedComponent {
  static override styles = css`
    .fields {
      display: grid;
      gap: var(--hb-space-4);
    }

    p {
      margin: 0;
    }

    hb-switch {
      display: flex;
      align-items: center;
      gap: var(--hb-space-3);
    }

    .avatar {
      inline-size: 40px;
      block-size: 40px;
      border-radius: 50%;
      object-fit: cover;
    }
  `;

  @query('hb-dialog')
  private accessor dialog!: HbDialog;

  @fromStore((state) => selectIsDialogOpen(state, DIALOG.PROFILE))
  private accessor open!: boolean;
  @fromStore((state) => state.user)
  private accessor user!: UserState;
  @fromStore(selectOwnProfileState)
  private accessor profile!: ProfilesState['own'];
  // Deleting the profile deletes these too, so they load with the dialog.
  @fromStore(selectOwnReactionsState)
  private accessor reactions!: ReactionsState['own'];

  @state()
  private accessor name = '';
  @state()
  private accessor showPhoto = true;
  @state()
  private accessor invalid = false;
  @state()
  private accessor confirmingDelete = false;
  // Set once the visitor changes a field, so a profile that loads later doesn't overwrite it.
  private edited = false;

  override willUpdate(changed: PropertyValues) {
    if (changed.has('open') && this.open) {
      this.invalid = false;
      this.confirmingDelete = false;
      this.edited = false;
      this.fill();
    } else if (this.open && changed.has('profile') && !this.edited) {
      this.fill();
    }
  }

  private get saved() {
    return this.profile instanceof Success && this.profile.data ? this.profile.data : undefined;
  }

  private get photo(): string {
    return this.user instanceof Success ? (this.user.data.photoURL ?? '') : '';
  }

  private fill() {
    const user = this.user instanceof Success ? this.user.data : undefined;
    this.name = this.saved?.name ?? user?.displayName ?? '';
    this.showPhoto = this.saved ? this.saved.photoUrl !== '' : true;
  }

  override render() {
    return html`
      <hb-dialog
        heading="${msg('Public profile', { id: 'dialogs.profile.heading' })}"
        ?open="${this.open}"
        @close="${this.onClose}"
      >
        ${this.confirmingDelete ? this.renderConfirmation() : this.renderFields()}
      </hb-dialog>
    `;
  }

  private renderFields() {
    return html`
      <div class="fields">
        <p>
          ${
            this.photo
              ? msg('Your name and photo show to everyone with your reactions.', {
                  id: 'dialogs.profile.intro-photo',
                })
              : msg('Your name shows to everyone with your reactions.', {
                  id: 'dialogs.profile.intro',
                })
          }
        </p>
        <hb-text-field
          name="name"
          label="${msg('Name', { id: 'dialogs.profile.name' })} *"
          .value="${this.name}"
          required
          maxlength="100"
          autocomplete="name"
          error="${
            this.invalid
              ? msg('Enter the name to show.', { id: 'dialogs.profile.name-required' })
              : ''
          }"
          @input="${this.onName}"
        ></hb-text-field>
        ${
          this.photo
            ? html`<hb-switch .checked="${this.showPhoto}" @change="${this.onShowPhoto}">
                <img class="avatar" src="${this.photo}" alt="" referrerpolicy="no-referrer" />
                ${msg('Show my photo', { id: 'dialogs.profile.show-photo' })}
              </hb-switch>`
            : nothing
        }
      </div>

      <hb-button slot="actions" @click="${this.save}">
        ${msg('Save', { id: 'dialogs.profile.save' })}
      </hb-button>
      ${
        this.saved
          ? html`<hb-button
              slot="actions"
              variant="text"
              @click="${() => (this.confirmingDelete = true)}"
            >
              ${msg('Delete profile', { id: 'dialogs.profile.delete' })}
            </hb-button>`
          : nothing
      }
      <hb-button slot="actions" variant="outlined" @click="${() => this.dialog.close()}">
        ${msg('Close', { id: 'common.close' })}
      </hb-button>
    `;
  }

  private renderConfirmation() {
    return html`
      <p>
        ${msg("Delete your profile and all your reactions? Others won't see your name anymore.", {
          id: 'dialogs.profile.delete-confirm',
        })}
      </p>

      <hb-button
        slot="actions"
        ?disabled="${!(this.reactions instanceof Success)}"
        @click="${this.delete}"
      >
        ${msg('Delete', { id: 'dialogs.profile.delete-yes' })}
      </hb-button>
      <hb-button
        slot="actions"
        variant="outlined"
        @click="${() => (this.confirmingDelete = false)}"
      >
        ${msg('Cancel', { id: 'dialogs.profile.delete-no' })}
      </hb-button>
    `;
  }

  private readonly onClose = () => {
    closeDialog();
  };

  private readonly onName = (event: Event) => {
    this.edited = true;
    this.name = (event.target as HbTextField).value;
  };

  private readonly onShowPhoto = (event: Event) => {
    this.edited = true;
    this.showPhoto = (event.target as HbSwitch).checked;
  };

  private readonly save = () => {
    if (!(this.user instanceof Success)) return;
    this.invalid = !notEmpty(this.name);
    if (this.invalid) return;
    const { uid } = this.user.data;
    setOwnProfile(uid, {
      name: this.name,
      photoUrl: this.showPhoto ? this.photo : '',
    });
    // The profile's write is queued first, so the rules see it before the reaction.
    const react = selectProfileDialogReaction(store.getState());
    if (react) {
      const current = selectOwnSessionReactions(store.getState(), react.sessionId);
      setUserReactions(react.sessionId, uid, toggled(current, react.reaction));
    }
    closeDialog();
    store.dispatch(queueSnackbar(msg('Profile saved', { id: 'dialogs.profile.saved' })));
  };

  private readonly delete = () => {
    if (!(this.user instanceof Success) || !deleteOwnProfile(this.user.data.uid)) return;
    closeDialog();
    store.dispatch(queueSnackbar(msg('Profile deleted', { id: 'dialogs.profile.deleted' })));
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-dialog': ProfileDialog;
  }
}
