import { Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import type { BuiltSession } from '../../schedule/build-schedule';
import { store } from '../../store';
import { openSigninDialog } from '../../store/dialogs';
import {
  type FeaturedSessionsState,
  selectFeaturedSessionsState,
  setUserFeaturedSessions,
} from '../../store/featured-sessions';
import { queueComplexSnackbar } from '../../store/snackbars';
import type { UserState } from '../../store/user';
import { confetti } from '../../utils/confetti';
import '../shared/hoverboard-icon';
import '../ui/hb-button';
import '../ui/hb-icon-button';
import { ThemedComponent } from '../themed-component';

/**
 * Adds a session to the visitor's schedule, or removes it, with confetti when added. Signed out, it
 * asks them to sign in. `icon` is a pressed star button, for a card; `button` says "Save" or
 * "Saved", for a page.
 */
@customElement('save-button')
export class SaveButton extends ThemedComponent {
  static override styles = css`
    :host {
      display: inline-flex;
    }
  `;

  @property({ attribute: false })
  accessor session: Pick<BuiltSession, 'id' | 'title'> | undefined;
  @property({ reflect: true })
  accessor variant: 'icon' | 'button' = 'icon';
  @fromStore((state) => state.user)
  accessor user!: UserState;
  @fromStore((state) => selectFeaturedSessionsState(state))
  accessor featuredSessions!: FeaturedSessionsState;

  private get saved(): boolean {
    return (
      this.featuredSessions instanceof Success &&
      !!this.session &&
      !!this.featuredSessions.data[this.session.id]
    );
  }

  override render() {
    const session = this.session;
    if (!session) return nothing;
    const saved = this.saved;
    const icon = html`<hoverboard-icon
      slot="${this.variant === 'button' ? 'icon' : nothing}"
      name="${saved ? 'star-filled' : 'star'}"
    ></hoverboard-icon>`;

    if (this.variant === 'button') {
      return html`
        <hb-button variant="${saved ? 'tonal' : 'filled'}" @click="${this.toggle}">
          ${icon}
          ${
            saved
              ? msg('Saved', { id: 'pages.session.saved' })
              : msg('Save', { id: 'pages.session.save' })
          }
        </hb-button>
      `;
    }
    return html`
      <hb-icon-button
        label="${msg(str`Save ${session.title}`, { id: 'schedule.session.save' })}"
        .pressed="${saved}"
        @click="${this.toggle}"
      >
        ${icon}
      </hb-icon-button>
    `;
  }

  private readonly toggle = (event: Event) => {
    if (!(this.user instanceof Success)) {
      store.dispatch(
        queueComplexSnackbar({
          label: msg('Sign in to save sessions', { id: 'common.save-sessions-signed-out' }),
          action: {
            title: msg('Sign in', { id: 'common.sign-in' }),
            callback: () => openSigninDialog(),
          },
        }),
      );
      return;
    }

    if (this.featuredSessions instanceof Success && this.session) {
      const saved = !this.saved;
      setUserFeaturedSessions(
        this.user.data.uid,
        { ...this.featuredSessions.data, [this.session.id]: saved },
        saved,
      );
      if (saved) confetti(event.currentTarget as Element);
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'save-button': SaveButton;
  }
}
