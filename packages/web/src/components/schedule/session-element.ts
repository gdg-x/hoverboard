import { Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Session } from '../../models/session';
import { sessionPath } from '../../utils/navigation';
import { store } from '../../store';
import { openFeedbackDialog, openSigninDialog } from '../../store/dialogs';
import {
  type FeaturedSessionsState,
  selectFeaturedSessionsState,
  setUserFeaturedSessions,
} from '../../store/featured-sessions';
import { queueComplexSnackbar } from '../../store/snackbars';
import type { UserState } from '../../store/user';
import { acceptingFeedback } from '../../utils/feedback';
import { confetti } from '../../utils/confetti';
import { getLocale } from '../../utils/localization';
import { tagChipStyle, tagColor } from '../../utils/styles';
import '../shared/hoverboard-icon';
import '../ui/hb-chip';
import '../ui/hb-icon-button';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

// The schedule generator (`packages/server/functions/src/schedule-generator/`) replaces speaker ids
// with speaker summaries, and adds the main tag, track and duration.
interface SessionSpeaker {
  company: string;
  country: string;
  name: string;
  photoUrl: string;
}

export type ScheduleSession = Omit<Session, 'speakers' | 'track'> & {
  duration?: { hh: number; mm: number };
  mainTag?: string;
  speakers?: SessionSpeaker[];
  track?: { title: string };
};

/** "1 hr 30 min", in the page locale. */
export const formatDuration = ({ hh, mm }: { hh: number; mm: number }) =>
  (
    [
      [hh, 'hour'],
      [mm, 'minute'],
    ] as const
  )
    .filter(([value]) => value)
    .map(([value, unit]) =>
      new Intl.NumberFormat(getLocale(), { style: 'unit', unit, unitDisplay: 'short' }).format(
        value,
      ),
    )
    .join(' ');

/**
 * A session in the schedule: a stripe in its main tag's color, its tags as chips, the title as the
 * link to the session page, speakers, and the track and duration. The bookmark button sits above
 * the link, and turns into a feedback button while the session takes feedback.
 */
@customElement('session-element')
export class SessionElement extends ThemedElement {
  static override styles = css`
    :host {
      display: block;
    }

    .session {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--hb-space-2);
      box-sizing: border-box;
      block-size: 100%;
      padding: var(--hb-space-4) var(--hb-space-4) var(--hb-space-4) calc(var(--hb-space-4) + 6px);
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-m);
      background-color: var(--hb-panel-background);
      backdrop-filter: var(--hb-backdrop-filter);
      background-image: linear-gradient(
        to right,
        var(--stripe, var(--hb-color-outline-variant)) 0 6px,
        transparent 6px
      );
      color: var(--hb-color-on-surface);
      box-shadow: var(--hb-shadow-card);
      transition:
        translate var(--hb-duration-short) var(--hb-ease-spring),
        box-shadow var(--hb-duration-short) var(--hb-ease-standard);
    }

    .session:hover {
      translate: -2px -2px;
      box-shadow: var(--hb-shadow-card-hover);
    }

    .session:has(.title a:focus-visible) {
      outline: 3px solid var(--hb-color-focus);
      outline-offset: 2px;
    }

    ul {
      display: flex;
      flex-wrap: wrap;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .chips {
      gap: var(--hb-space-1);
      padding-inline-end: var(--hb-target-min);
    }

    .title {
      margin: 0;
      padding-inline-end: var(--hb-target-min);
      font: 700 var(--hb-text-lg) / 1.3 var(--hb-font-body);
      overflow-wrap: anywhere;
    }

    .title a {
      color: inherit;
      text-decoration: none;
    }

    .title a:focus-visible {
      outline: none;
    }

    /* The whole card is the link. */
    .title a::after {
      content: '';
      position: absolute;
      z-index: 1;
      inset: 0;
      border-radius: inherit;
    }

    .speakers {
      gap: var(--hb-space-2) var(--hb-space-4);
      font-size: var(--hb-text-sm);
    }

    .speakers li {
      display: inline-flex;
      align-items: center;
      gap: var(--hb-space-2);
    }

    .speakers img {
      inline-size: 28px;
      block-size: 28px;
      border-radius: 50%;
      background-color: var(--hb-color-surface-container);
      object-fit: cover;
    }

    .meta {
      margin: auto 0 0;
      color: var(--hb-color-on-surface-variant);
      font: var(--hb-text-sm) / 1.4 var(--hb-font-mono);
    }

    .action {
      position: absolute;
      z-index: 2;
      inset-block-start: var(--hb-space-1);
      inset-inline-end: var(--hb-space-1);
    }

    @media (prefers-reduced-motion: reduce) {
      .session:hover {
        translate: none;
      }
    }

    @media (forced-colors: active) {
      .session {
        border-color: CanvasText;
        border-inline-start-width: 6px;
      }
    }
  `;

  @fromStore((state) => state.user)
  accessor user!: UserState;
  @property({ attribute: false })
  accessor session: Session | undefined;
  @fromStore((state) => selectFeaturedSessionsState(state))
  accessor featuredSessions!: FeaturedSessionsState;

  // Depends on the time, so it is only set in the browser.
  @state()
  private accessor acceptingFeedback = false;

  override updated(changed: PropertyValues<this>) {
    if (changed.has('session')) {
      this.acceptingFeedback =
        __HB_FEATURES__.feedback && !!this.session && acceptingFeedback(this.session);
    }
  }

  override render() {
    const session = this.session as ScheduleSession | undefined;
    if (!session) return nothing;
    const meta = [
      session.track?.title,
      session.duration && formatDuration(session.duration),
      session.complexity,
      session.language,
    ].filter(Boolean);

    return html`
      <article
        class="session"
        style="${styleMap({ '--stripe': session.mainTag ? tagColor(session.mainTag) : undefined })}"
      >
        ${
          session.tags?.length
            ? html`<ul class="chips">
                ${session.tags.map(
                  (tag) =>
                    html`<li><hb-chip style="${styleMap(tagChipStyle(tag))}">${tag}</hb-chip></li>`,
                )}
              </ul>`
            : nothing
        }
        <h3 class="title"><a href="${sessionPath(session.id)}">${session.title}</a></h3>
        ${
          session.speakers?.some((speaker) => speaker.name)
            ? html`<ul class="speakers">
                ${session.speakers
                  .filter((speaker) => speaker.name)
                  .map(
                    (speaker) => html`
                      <li>
                        <img
                          src="${speaker.photoUrl}"
                          alt=""
                          loading="lazy"
                          decoding="async"
                          width="28"
                          height="28"
                        />
                        ${speaker.name}
                      </li>
                    `,
                  )}
              </ul>`
            : nothing
        }
        ${meta.length ? html`<p class="meta">${meta.join(' · ')}</p>` : nothing}
        ${this.renderAction(session)}
      </article>
    `;
  }

  private renderAction(session: ScheduleSession) {
    if (this.acceptingFeedback) {
      return html`
        <hb-icon-button
          class="action feedback"
          label="${msg(str`Rate ${session.title}`, { id: 'schedule.session.rate' })}"
          @click="${this.openFeedback}"
        >
          <hoverboard-icon name="insert-comment"></hoverboard-icon>
        </hb-icon-button>
      `;
    }
    if (!__HB_FEATURES__.mySchedule) return nothing;
    const bookmarked = this.isBookmarked;
    return html`
      <hb-icon-button
        class="action bookmark"
        label="${msg(str`Bookmark ${session.title}`, { id: 'schedule.session.bookmark' })}"
        .pressed="${bookmarked}"
        @click="${this.toggleBookmark}"
      >
        <hoverboard-icon
          name="${bookmarked ? 'bookmark-check' : 'bookmark-plus'}"
        ></hoverboard-icon>
      </hb-icon-button>
    `;
  }

  private get isBookmarked(): boolean {
    if (this.featuredSessions instanceof Success && this.session?.id) {
      return this.featuredSessions.data[this.session.id] ?? false;
    }
    return false;
  }

  private readonly toggleBookmark = (event: Event) => {
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
      const bookmarked = !this.featuredSessions.data[this.session.id];
      setUserFeaturedSessions(
        this.user.data.uid,
        { ...this.featuredSessions.data, [this.session.id]: bookmarked },
        bookmarked,
      );
      if (bookmarked) confetti(event.currentTarget as Element);
    }
  };

  private readonly openFeedback = () => {
    if (this.session) openFeedbackDialog(this.session);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'session-element': SessionElement;
  }
}
