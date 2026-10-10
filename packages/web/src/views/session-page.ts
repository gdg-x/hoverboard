import { Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import '../components/shared/add-to-calendar';
import '../components/shared/share-button';
import '../components/shared/auth-required';
import '../components/hero/hero-block';
import { heroText } from '../components/hero/hero-block';
import '../components/shared/hoverboard-icon';
import '../components/shared/speaker-card';
import '../components/markdown/short-markdown';
import '../components/ui/hb-button';
import '../components/ui/hb-chip';
import '../components/ui/hb-progress';
import { PAGE_TONES } from '../components/hero/simple-hero';
import { formatDuration } from '../components/schedule/session-element';
import type { BuiltSession } from '../schedule/build-schedule';
import { goto } from '../utils/navigation';
import { store } from '../store';
import { openSigninDialog } from '../store/dialogs';
import {
  type FeaturedSessionsState,
  selectFeaturedSessionsState,
  setUserFeaturedSessions,
} from '../store/featured-sessions';
import { selectSession } from '../store/sessions/selectors';
import { type SessionsState, selectSessionsState } from '../store/schedule';
import { queueComplexSnackbar } from '../store/snackbars';
import { openVideoDialog } from '../store/ui';
import type { UserState } from '../store/user';
import { disabledSchedule } from '../config/site';
import { acceptingFeedback } from '../utils/feedback';
import { getScheduleDay } from '../utils/dates';
import { confetti } from '../utils/confetti';
import { updateImageMetadata } from '../utils/metadata';
import { tagChipStyle } from '../utils/styles';
import { fromStore } from '../controllers/from-store';
import { ThemedElement } from '../components/themed-element';

/** The feedback block, which the page loads without waiting. Tests wait for it. */
export const feedbackBlock = __HB_FEATURES__.feedback
  ? import('../components/dialogs/feedback-block')
  : Promise.resolve();

/**
 * A session: its title, when and where it is, its tags, actions to bookmark, add to a calendar and
 * share, the description, its speakers and, once it started, a place to leave feedback.
 */
@customElement('session-page')
export class SessionPage extends ThemedElement {
  static override styles = [
    heroText,
    css`
      :host {
        display: block;
        background-color: var(--hb-section-background);
        color: var(--hb-color-on-surface);
      }

      ul {
        display: flex;
        flex-wrap: wrap;
        gap: var(--hb-space-2);
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .details {
        margin-block-start: var(--hb-space-5);
      }

      .details .plain {
        --hb-chip-border-color: currentColor;
      }

      /* Content-box, so the text column lines up with the hero's. */
      .inner {
        box-sizing: content-box;
        max-inline-size: var(--hb-content-max);
        margin-inline: auto;
        padding: var(--hb-space-6) var(--hb-gutter) var(--hb-space-9);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--hb-space-3);
      }

      .description {
        display: block;
        max-inline-size: var(--hb-prose-max);
        margin-block: var(--hb-space-6);
        font-size: var(--hb-text-lg);
        line-height: 1.6;
      }

      h2 {
        margin: var(--hb-space-8) 0 var(--hb-space-4);
        padding: 0;
        font: 800 var(--hb-text-2xl) / 1.15 var(--hb-font-display);
      }

      .speakers {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
        gap: var(--hb-space-5);
      }

      .speakers > li {
        display: grid;
      }
    `,
  ];

  @fromStore((state) => selectSessionsState(state))
  accessor sessions!: SessionsState;
  @property({ attribute: false })
  accessor session: BuiltSession | undefined;
  @property({ type: String })
  accessor sessionId: string | undefined;
  @fromStore((state) => selectFeaturedSessionsState(state))
  accessor featuredSessions!: FeaturedSessionsState;
  @fromStore((state) => state.user)
  accessor user!: UserState;

  // Depends on the time, so it is only set in the browser.
  @state()
  private accessor acceptingFeedback = false;

  // Runs on the server too, so the page renders the session. Side effects wait for `updated`.
  override willUpdate(changed: PropertyValues<this>) {
    if ((changed.has('sessions') || changed.has('sessionId')) && this.isLoaded) {
      this.session = selectSession(store.getState(), this.sessionId!);
    }
  }

  override updated(changed: PropertyValues<this>) {
    if ((changed.has('sessions') || changed.has('sessionId')) && this.isLoaded) {
      if (!this.session) {
        goto('/404');
      } else {
        this.acceptingFeedback = __HB_FEATURES__.feedback && acceptingFeedback(this.session);
        const speaker = this.session.speakers[0];
        updateImageMetadata(this.session.title, this.session.description, {
          image: speaker?.photoUrl ?? '',
          imageAlt: speaker?.name ?? '',
        });
      }
    }
  }

  private get isLoaded() {
    return !!this.sessionId && this.sessions instanceof Success;
  }

  private get isBookmarked() {
    return (
      this.featuredSessions instanceof Success &&
      !!this.sessionId &&
      !!this.featuredSessions.data[this.sessionId]
    );
  }

  override render() {
    const session = this.session;
    return html`
      <hero-block tone="${PAGE_TONES.schedule}">
        <a class="back" href="${session?.day ? `/schedule/${session.day}` : '/schedule'}">
          <hoverboard-icon name="arrow-left"></hoverboard-icon>
          ${msg('Back to schedule', { id: 'pages.session.back-to-schedule' })}
        </a>
        <h1 class="hero-title">${session?.title ?? ''}</h1>
        ${session ? this.renderDetails(session) : nothing}
      </hero-block>

      <hb-progress ?hidden="${!!session}"></hb-progress>

      ${session ? this.renderContent(session) : nothing}
    `;
  }

  private renderDetails(session: BuiltSession) {
    const when = disabledSchedule
      ? []
      : [
          session.day && getScheduleDay(session.day),
          session.startTime && [session.startTime, session.endTime].filter(Boolean).join('–'),
          session.duration && formatDuration(session.duration),
          session.track?.title,
        ];
    const details = [...when, session.complexity, session.language].filter(Boolean);
    return html`
      <ul class="details" aria-label="${msg('Session details', { id: 'pages.session.details' })}">
        ${details.map((detail) => html`<li><hb-chip class="plain">${detail}</hb-chip></li>`)}
        ${
          session.sponsor
            ? html`<li>
                <hb-chip class="sponsored" accent="1">
                  ${msg(str`Sponsored by ${session.sponsor}`, {
                    id: 'pages.session.sponsored-by',
                  })}
                </hb-chip>
              </li>`
            : nothing
        }
        ${(session.tags ?? []).map(
          (tag) => html`<li><hb-chip style="${styleMap(tagChipStyle(tag))}">${tag}</hb-chip></li>`,
        )}
      </ul>
    `;
  }

  private renderContent(session: BuiltSession) {
    const bookmarked = this.isBookmarked;
    // A speaker document can be missing its name while it is being added.
    const speakers = session.speakers.filter((speaker) => speaker.name);
    return html`
      <div class="inner">
        <div class="actions">
          ${
            __HB_FEATURES__.mySchedule
              ? html`<hb-button
                  class="bookmark"
                  variant="${bookmarked ? 'tonal' : 'filled'}"
                  @click="${this.toggleBookmark}"
                >
                  <hoverboard-icon
                    slot="icon"
                    name="${bookmarked ? 'bookmark-check' : 'bookmark-plus'}"
                  ></hoverboard-icon>
                  ${
                    bookmarked
                      ? msg('Bookmarked', { id: 'pages.session.bookmarked' })
                      : msg('Bookmark', { id: 'pages.session.bookmark' })
                  }
                </hb-button>`
              : nothing
          }
          ${
            session.videoId
              ? html`<hb-button variant="outlined" class="video-button" @click="${this.openVideo}">
                  <hoverboard-icon slot="icon" name="video"></hoverboard-icon>
                  ${msg('View video', { id: 'common.view-video' })}
                </hb-button>`
              : nothing
          }
          ${
            session.presentation
              ? html`<hb-button variant="outlined" href="${session.presentation}" target="_blank">
                  <hoverboard-icon slot="icon" name="presentation"></hoverboard-icon>
                  ${msg('View presentation', { id: 'common.view-presentation' })}
                </hb-button>`
              : nothing
          }
          <add-to-calendar .session="${this.session}"></add-to-calendar>
          <share-button
            .data="${{ title: session.title, text: session.description }}"
          ></share-button>
        </div>

        <short-markdown class="description" .content="${session.description}"></short-markdown>

        ${
          speakers.length
            ? html`
                <h2>${msg('Speakers', { id: 'pages.session.speakers' })}</h2>
                <ul class="speakers">
                  ${speakers.map(
                    (speaker) => html`<li><speaker-card .speaker="${speaker}"></speaker-card></li>`,
                  )}
                </ul>
              `
            : nothing
        }
        ${
          this.acceptingFeedback
            ? html`
                <section id="feedback" aria-labelledby="feedback-title">
                  <h2 id="feedback-title">
                    ${msg('Review session', { id: 'common.review-session' })}
                  </h2>
                  <auth-required>
                    <span slot="prompt">
                      ${msg('to leave feedback', {
                        id: 'pages.session.leave-feedback',
                        desc: 'Follows a Sign in button: "Sign in to leave feedback".',
                      })}
                    </span>
                    <feedback-block .sessionId="${session.id}"></feedback-block>
                  </auth-required>
                </section>
              `
            : nothing
        }
      </div>
    `;
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

  private readonly openVideo = () => {
    if (this.session?.videoId) {
      openVideoDialog({ title: this.session.title, youtubeId: this.session.videoId });
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'session-page': SessionPage;
  }
}
