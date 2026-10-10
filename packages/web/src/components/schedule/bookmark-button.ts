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
 * asks them to sign in. `icon` is a pressed icon button, for a card; `button` says "Bookmark" or
 * "Bookmarked", for a page.
 */
@customElement('bookmark-button')
export class BookmarkButton extends ThemedComponent {
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

  private get bookmarked(): boolean {
    return (
      this.featuredSessions instanceof Success &&
      !!this.session &&
      !!this.featuredSessions.data[this.session.id]
    );
  }

  override render() {
    const session = this.session;
    if (!session) return nothing;
    const bookmarked = this.bookmarked;
    const icon = html`<hoverboard-icon
      slot="${this.variant === 'button' ? 'icon' : nothing}"
      name="${bookmarked ? 'bookmark-check' : 'bookmark-plus'}"
    ></hoverboard-icon>`;

    if (this.variant === 'button') {
      return html`
        <hb-button variant="${bookmarked ? 'tonal' : 'filled'}" @click="${this.toggle}">
          ${icon}
          ${
            bookmarked
              ? msg('Bookmarked', { id: 'pages.session.bookmarked' })
              : msg('Bookmark', { id: 'pages.session.bookmark' })
          }
        </hb-button>
      `;
    }
    return html`
      <hb-icon-button
        label="${msg(str`Bookmark ${session.title}`, { id: 'schedule.session.bookmark' })}"
        .pressed="${bookmarked}"
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
      const bookmarked = !this.bookmarked;
      setUserFeaturedSessions(
        this.user.data.uid,
        { ...this.featuredSessions.data, [this.session.id]: bookmarked },
        bookmarked,
      );
      if (bookmarked) confetti(event.currentTarget as Element);
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'bookmark-button': BookmarkButton;
  }
}
