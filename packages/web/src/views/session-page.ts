import { Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import '@material/web/button/outlined-button.js';
import '@material/web/fab/fab.js';
import '@material/web/progress/linear-progress.js';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import '../components/shared/add-to-calendar';
import '../components/shared/share-button';
import '../components/shared/auth-required';
import '../components/shared/content-loader';
import '../components/dialogs/feedback-block';
import '../components/hero/simple-hero';
import '../components/shared/hoverboard-icon';
import '../components/markdown/short-markdown';
import type { Session } from '../models/session';
import type { Speaker } from '../models/speaker';
import { router } from '../router';
import { store } from '../store';
import { initialAuthState } from '../store/auth';
import { openSigninDialog } from '../store/dialogs';
import {
  type FeaturedSessionsState,
  selectFeaturedSessionsState,
  setUserFeaturedSessions,
} from '../store/featured-sessions';
import { selectSession } from '../store/sessions/selectors';
import { type SessionsState, selectSessionsState } from '../store/sessions';
import { queueComplexSnackbar } from '../store/snackbars';
import { initialUiState, openVideoDialog } from '../store/ui';
import type { UserState } from '../store/user';
import { disabledSchedule } from '../config/site';
import { acceptingFeedback } from '../utils/feedback';
import { updateImageMetadata } from '../utils/metadata';
import { getVariableColor } from '../utils/styles';
import { fromStore } from '../controllers/from-store';
import { ThemedElement } from '../components/themed-element';

// `Session` (as returned by `selectSession`) does not declare `dateReadable`,
// `endTime`, `track`, or a resolved `speakers` array — the original template
// read these fields directly without static type-checking. Keep this
// augmentation so the template stays fully typed without changing today's
// (already loosely-typed) output.
type SessionWithDetails = Omit<Session, 'speakers'> & {
  dateReadable?: string;
  endTime?: string;
  track?: { title?: string };
  speakers?: Speaker[];
};

@customElement('session-page')
export class SessionPage extends ThemedElement {
  static override styles = css`
    :host {
      margin: 0;
      display: block;
      height: 100%;
      width: 100%;
      background: var(--primary-background-color);
      color: var(--primary-text-color);
    }

    .header-content,
    .content {
      padding: 24px;
    }

    .header-content {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      margin-bottom: 8px;
      color: inherit;
      text-decoration: none;
    }

    .back-link hoverboard-icon {
      margin-right: 4px;
      width: 18px;
      height: 18px;
    }

    .name {
      line-height: 1.2;
    }

    .tags {
      margin-top: 8px;
    }

    .tag {
      color: var(--text-primary-color);
      background-color: var(--color, var(--secondary-text-color));
      border-color: var(--color, var(--secondary-text-color));
    }

    .float-button {
      position: fixed;
      right: 24px;
      bottom: 24px;
    }

    .content {
      position: relative;
      font-size: 15px;
      line-height: 1.87;
    }

    .meta-info {
      line-height: 1.6;
    }

    .description {
      margin: 24px 0 32px;
      max-width: 700px;
    }

    .action {
      color: var(--primary-text-color);
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
    }

    .action hoverboard-icon {
      margin-right: 4px;
      width: 18px;
      height: 18px;
    }

    .additional-sections {
      margin-top: 32px;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
    }

    .section-content {
      display: flex;
    }

    .section-content {
      align-items: center;
    }

    .section {
      margin-top: 16px;
      display: block;
      color: var(--primary-text-color);
      cursor: pointer;
    }

    .section-photo {
      margin-right: 16px;
      --lazy-image-width: 48px;
      --lazy-image-height: 48px;
      --lazy-image-fit: cover;
      width: var(--lazy-image-width);
      height: var(--lazy-image-height);
      background-color: var(--secondary-background-color);
      border-radius: 50%;
      overflow: hidden;
      transform: translateZ(0);
    }

    .section-primary-text {
      margin-bottom: 4px;
      line-height: 1.2;
    }

    .section-secondary-text {
      font-size: 12px;
      line-height: 1;
    }

    .section-details {
      flex: 1;
      flex-basis: 1px;
    }

    @media (min-width: 812px) {
      .header-content,
      .content {
        padding: 24px;
        width: 100%;
      }

      .header-content {
        min-height: 160px;
      }

      .float-button {
        position: absolute;
        bottom: -60px;
        transform: translate(50%, 50%);
      }
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
    }

    .progress {
      width: 100%;
      --md-linear-progress-active-indicator-color: var(--default-primary-color);
      --md-linear-progress-track-color: var(--default-primary-color);
    }
  `;

  @fromStore((state) => selectSessionsState(state))
  accessor sessions!: SessionsState;
  @property({ type: Object })
  accessor session: Session | undefined;
  @property({ type: String })
  accessor sessionId: string | undefined;
  @fromStore((state) => selectFeaturedSessionsState(state))
  accessor featuredSessions!: FeaturedSessionsState;
  @fromStore((state) => state.user)
  accessor user!: UserState;
  @fromStore((state) => state.auth)
  accessor auth!: typeof initialAuthState;

  @fromStore((state) => state.ui.viewport)
  private accessor viewport!: typeof initialUiState.viewport;
  @state()
  private accessor disabledSchedule: boolean = disabledSchedule;
  @state()
  private accessor contentLoaderVisibility: boolean = false;
  @state()
  private accessor acceptingFeedback: boolean = false;

  override updated(changed: Map<string, unknown>) {
    if (changed.has('sessions') || changed.has('sessionId')) {
      this.updateSession();
    }
  }

  private updateSession() {
    if (this.sessionId && this.sessions instanceof Success) {
      this.session = selectSession(store.getState(), this.sessionId);
      this.contentLoaderVisibility = !!this.session;

      if (!this.session) {
        router.goto('/404');
      } else {
        this.acceptingFeedback = acceptingFeedback(this.session);
        const speaker = (this.session as unknown as SessionWithDetails).speakers?.[0];
        updateImageMetadata(this.session.title, this.session.description, {
          image: speaker?.photoUrl ?? '',
          imageAlt: speaker?.name ?? '',
        });
      }
    }
  }

  private get featuredSessionIcon() {
    if (
      this.featuredSessions instanceof Success &&
      this.sessionId &&
      this.featuredSessions.data[this.sessionId]
    ) {
      return 'bookmark-check';
    } else {
      return 'bookmark-plus';
    }
  }

  private toggleFeaturedSession = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();

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

    if (this.user instanceof Success && this.featuredSessions instanceof Success && this.session) {
      const bookmarked = !this.featuredSessions.data[this.session.id];
      const sessions = {
        ...this.featuredSessions.data,
        [this.session.id]: bookmarked,
      };

      setUserFeaturedSessions(this.user.data.uid, sessions, bookmarked);
    }
  };

  private openVideo = () => {
    if (!this.session || !this.session.videoId) {
      return;
    }

    openVideoDialog({
      title: this.session.title,
      youtubeId: this.session.videoId,
    });
  };

  private getVariableColor(value: string) {
    return getVariableColor(this, value);
  }

  private speakerUrl(id: string) {
    return router.urlForName('speaker-page', { id });
  }

  override render() {
    const session = this.session as SessionWithDetails | undefined;
    const complexity = session?.complexity;
    const toggleFeatured = msg('Toggle featured session', { id: 'pages.session.toggle-featured' });

    return html`
      <simple-hero page="schedule">
        <div class="header-content">
          <a class="back-link" href="${session?.day ? `/schedule/${session.day}` : '/schedule'}">
            <hoverboard-icon name="arrow-left"></hoverboard-icon>
            <span>${msg('Back to schedule', { id: 'pages.session.back-to-schedule' })}</span>
          </a>
          <h2 class="name">${session?.title ?? ''}</h2>
          ${
            session?.tags?.length
              ? html`
                  <div class="tags">
                    ${session.tags.map(
                      (tag) => html`
                        <span class="tag" style="--color: ${this.getVariableColor(tag) ?? ''}"
                          >${tag}</span
                        >
                      `,
                    )}
                  </div>
                `
              : nothing
          }

          <div class="float-button" ?hidden="${!this.contentLoaderVisibility}">
            <md-fab
              ?hidden="${!this.viewport.isLaptopPlus}"
              aria-label="${toggleFeatured}"
              @click="${this.toggleFeaturedSession}"
            >
              <hoverboard-icon slot="icon" name="${this.featuredSessionIcon}"></hoverboard-icon>
            </md-fab>
          </div>
        </div>
      </simple-hero>

      <md-linear-progress
        class="progress"
        indeterminate
        ?hidden="${this.contentLoaderVisibility}"
      ></md-linear-progress>

      <content-loader
        class="container"
        card-padding="32px"
        card-height="400px"
        horizontal-position="50%"
        border-radius="4px"
        box-shadow="var(--box-shadow)"
        items-count="1"
        ?hidden="${this.contentLoaderVisibility}"
      ></content-loader>

      <div class="container content">
        <div class="float-button" ?hidden="${!this.contentLoaderVisibility}">
          <md-fab
            ?hidden="${this.viewport.isLaptopPlus}"
            aria-label="${toggleFeatured}"
            @click="${this.toggleFeaturedSession}"
          >
            <hoverboard-icon slot="icon" name="${this.featuredSessionIcon}"></hoverboard-icon>
          </md-fab>
        </div>
        <h3 class="meta-info" ?hidden="${this.disabledSchedule}">
          ${session?.dateReadable}, ${session?.startTime} - ${session?.endTime}
        </h3>
        <h3 class="meta-info" ?hidden="${this.disabledSchedule}">${session?.track?.title}</h3>
        <h3 class="meta-info" ?hidden="${!complexity}">
          ${msg(str`Content level: ${complexity}`, { id: 'pages.session.content-level' })}
        </h3>

        <short-markdown
          class="description"
          .content="${session?.description ?? ''}"
        ></short-markdown>

        <div class="actions">
          ${
            session?.presentation
              ? html`
                  <a
                    class="action"
                    href="${session.presentation}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <hoverboard-icon name="presentation"></hoverboard-icon>
                    <span>${msg('View presentation', { id: 'common.view-presentation' })}</span>
                  </a>
                `
              : nothing
          }
          ${
            session?.videoId
              ? html`
                  <md-outlined-button class="video-button" @click="${this.openVideo}">
                    <hoverboard-icon slot="icon" name="video"></hoverboard-icon>
                    ${msg('View video', { id: 'common.view-video' })}
                  </md-outlined-button>
                `
              : nothing
          }
          <add-to-calendar .session="${this.session}"></add-to-calendar>
          <share-button
            .data="${session ? { title: session.title, text: session.description } : undefined}"
          ></share-button>
        </div>

        ${
          session?.speakers?.length
            ? html`
                <div class="additional-sections">
                  <h3>${msg('Speakers', { id: 'pages.session.speakers' })}</h3>
                  ${session.speakers.map(
                    (speaker) => html`
                      <a class="section" href="${this.speakerUrl(speaker.id)}">
                        <div class="section-content">
                          <img
                            loading="lazy"
                            decoding="async"
                            class="section-photo"
                            src="${speaker.photoUrl}"
                            alt="${speaker.name}"
                          />

                          <div class="section-details">
                            <div class="section-primary-text">${speaker.name}</div>
                            <div class="section-secondary-text">
                              ${speaker.company} / ${speaker.country}
                            </div>
                          </div>
                        </div>
                      </a>
                    `,
                  )}
                </div>
              `
            : nothing
        }

        <div id="feedback" class="additional-sections">
          <h3>${msg('Review session', { id: 'common.review-session' })}</h3>

          <auth-required ?hidden="${!this.acceptingFeedback}">
            <slot slot="prompt">
              ${msg('to leave feedback', {
                id: 'pages.session.leave-feedback',
                desc: 'Follows a Sign in button: "Sign in to leave feedback".',
              })}
            </slot>
            <feedback-block .sessionId="${session?.id}"></feedback-block>
          </auth-required>

          <p ?hidden="${this.acceptingFeedback}">
            ${msg('Session reviews are not open', { id: 'pages.session.feedback-closed' })}
          </p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'session-page': SessionPage;
  }
}
