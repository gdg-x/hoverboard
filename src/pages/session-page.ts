import { Initialized, Success } from '@abraham/remotedata';
import '@material/web/fab/fab.js';
import '@material/web/progress/linear-progress.js';
import '@power-elements/lazy-image';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { RouterLocation } from '@vaadin/router';
import '../components/auth-required';
import '../components/content-loader';
import '../components/feedback-block';
import '../components/footer-block';
import '../components/hero/simple-hero';
import '../components/hoverboard-icon';
import '../components/markdown/short-markdown';
import { ThemedElement } from '../components/themed-element';
import { Session } from '../models/session';
import { Speaker } from '../models/speaker';
import { router } from '../router';
import { RootState, store } from '../store';
import { initialAuthState } from '../store/auth';
import { openSigninDialog } from '../store/dialogs';
import {
  FeaturedSessionsState,
  selectFeaturedSessionsState,
  setUserFeaturedSessions,
} from '../store/featured-sessions';
import { ReduxMixin } from '../store/mixin';
import { selectSession } from '../store/sessions/selectors';
import { SessionsState, selectSessionsState } from '../store/sessions';
import { queueComplexSnackbar } from '../store/snackbars';
import { initialUiState, openVideoDialog } from '../store/ui';
import { UserState } from '../store/user';
import { disabledSchedule, feedback, schedule, sessionDetails } from '../utils/data';
import { acceptingFeedback } from '../utils/feedback';
import { updateImageMetadata } from '../utils/metadata';
import { getVariableColor } from '../utils/styles';

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
export class SessionPage extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          margin: 0;
          display: block;
          height: 100%;
          width: 100%;
          background: #fff;
          color: var(--primary-text-color);
        }

        .header-content,
        .content {
          padding: 24px;
        }

        .header-content {
          position: relative;
        }

        .name {
          line-height: 1.2;
        }

        .tags {
          margin-top: 8px;
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
          margin-right: 16px;
          color: var(--primary-text-color);
          cursor: pointer;
          user-select: none;
        }

        .action hoverboard-icon {
          margin-right: 4px;
          width: 18px;
          height: 18px;
        }

        .additional-sections {
          margin-top: 32px;
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
      `,
    ];
  }

  private feedback = feedback;
  private sessionDetails = sessionDetails;

  @property({ type: Object })
  sessions: SessionsState = new Initialized();
  @property({ type: Object })
  session: Session | undefined;
  @property({ type: String })
  sessionId: string | undefined;
  @property({ type: Object })
  featuredSessions: FeaturedSessionsState = new Initialized();
  @property({ type: Object })
  user: UserState = new Initialized();
  @property({ type: Object })
  auth = initialAuthState;

  @state()
  private viewport = initialUiState.viewport;
  @state()
  private disabledSchedule: boolean = disabledSchedule;
  @state()
  private contentLoaderVisibility: boolean = false;
  @state()
  private acceptingFeedback: boolean = false;

  override stateChanged(state: RootState) {
    this.sessions = selectSessionsState(state);
    this.user = state.user;
    this.auth = state.auth;
    this.featuredSessions = selectFeaturedSessionsState(state);
    this.viewport = state.ui.viewport;
  }

  onAfterEnter(location: RouterLocation) {
    this.sessionId = location.params?.['id']?.toString();
    this.updateSession();
  }

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
        router.render('/404');
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

  private toggleFeaturedSession(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!(this.user instanceof Success)) {
      store.dispatch(
        queueComplexSnackbar({
          label: schedule.saveSessionsSignedOut,
          action: {
            title: 'Sign in',
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
  }

  private openVideo() {
    if (!this.session || !this.session.videoId) {
      return;
    }

    openVideoDialog({
      title: this.session.title,
      youtubeId: this.session.videoId,
    });
  }

  private getVariableColor(value: string) {
    return getVariableColor(this, value);
  }

  private speakerUrl(id: string) {
    return router.urlForName('speaker-page', { id });
  }

  override render() {
    const session = this.session as SessionWithDetails | undefined;

    return html`
      <simple-hero page="schedule">
        <div class="header-content" layout vertical end-justified>
          <h2 class="name">${session?.title ?? ''}</h2>
          ${
            session?.tags?.length
              ? html`
                  <div class="tags">
                    ${session.tags.map(
                      (tag) => html`
                        <span class="tag" style="color: ${this.getVariableColor(tag)}">${tag}</span>
                      `,
                    )}
                  </div>
                `
              : nothing
          }

          <div class="float-button" ?hidden="${!this.contentLoaderVisibility}">
            <md-fab
              ?hidden="${!this.viewport.isLaptopPlus}"
              aria-label="Toggle featured session"
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
            aria-label="Toggle featured session"
            @click="${this.toggleFeaturedSession}"
          >
            <hoverboard-icon slot="icon" name="${this.featuredSessionIcon}"></hoverboard-icon>
          </md-fab>
        </div>
        <h3 class="meta-info" ?hidden="${this.disabledSchedule}">
          ${session?.dateReadable}, ${session?.startTime} - ${session?.endTime}
        </h3>
        <h3 class="meta-info" ?hidden="${this.disabledSchedule}">${session?.track?.title}</h3>
        <h3 class="meta-info" ?hidden="${!session?.complexity}">
          ${this.sessionDetails.contentLevel}: ${session?.complexity}
        </h3>

        <short-markdown
          class="description"
          .content="${session?.description ?? ''}"
        ></short-markdown>

        <div class="actions" layout horizontal>
          ${
            session?.presentation
              ? html`
                  <a
                    class="action"
                    href="${session.presentation}"
                    target="_blank"
                    rel="noopener noreferrer"
                    layout
                    horizontal
                    center
                  >
                    <hoverboard-icon name="presentation"></hoverboard-icon>
                    <span>${this.sessionDetails.viewPresentation}</span>
                  </a>
                `
              : nothing
          }
          ${
            session?.videoId
              ? html`
                  <div class="action" @click="${this.openVideo}" layout horizontal center>
                    <hoverboard-icon name="video"></hoverboard-icon>
                    ${this.sessionDetails.viewVideo}
                  </div>
                `
              : nothing
          }
        </div>

        ${
          session?.speakers?.length
            ? html`
                <div class="additional-sections">
                  <h3>${this.sessionDetails.speakers}</h3>
                  ${session.speakers.map(
                    (speaker) => html`
                      <a class="section" href="${this.speakerUrl(speaker.id)}">
                        <div layout horizontal center>
                          <lazy-image
                            class="section-photo"
                            src="${speaker.photoUrl}"
                            alt="${speaker.name}"
                          ></lazy-image>

                          <div class="section-details" flex>
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
          <h3>${this.feedback.headline}</h3>

          <auth-required ?hidden="${!this.acceptingFeedback}">
            <slot slot="prompt">${this.feedback.leaveFeedback}</slot>
            <feedback-block .sessionId="${session?.id}"></feedback-block>
          </auth-required>

          <p ?hidden="${this.acceptingFeedback}">${this.feedback.sessionClosed}</p>
        </div>
      </div>

      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'session-page': SessionPage;
  }
}
