import { Initialized, Success } from '@abraham/remotedata';
import '@power-elements/lazy-image';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { Session } from '../models/session';
import { router } from '../router';
import { RootState, store } from '../store';
import { openFeedbackDialog, openSigninDialog } from '../store/dialogs';
import {
  FeaturedSessionsState,
  selectFeaturedSessionsState,
  setUserFeaturedSessions,
} from '../store/featured-sessions';
import { ReduxMixin } from '../store/mixin';
import { queueComplexSnackbar } from '../store/snackbars';
import { UserState } from '../store/user';
import { schedule } from '../utils/data';
import { acceptingFeedback } from '../utils/feedback';
import { getVariableColor } from '../utils/styles';
import './hoverboard-icon';
import './text-truncate';
import { ThemedElement } from './themed-element';

// The runtime `session.speakers` payload is an enriched list of speaker summaries (see
// `functions/src/schedule-generator/speakers-sessions-schedule-map.ts`), not the `string[]` of ids
// declared on `SessionData`. The same generator also adds a computed `duration` that
// isn't declared on `SessionData`.
interface SessionSpeaker {
  company: string;
  country: string;
  name: string;
  photoUrl: string;
}

interface SessionDuration {
  hh: number;
  mm: number;
}

type SessionWithScheduleDetails = Omit<Session, 'speakers'> & {
  duration?: SessionDuration;
  speakers?: SessionSpeaker[];
};

@customElement('session-element')
export class SessionElement extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          display: block;
          background-color: var(--primary-background-color);
          border-bottom: 1px solid var(--border-light-color);
          height: 100%;
          border-radius: var(--border-radius);
        }

        .session {
          position: relative;
          display: flex;
          height: 100%;
          flex-direction: column;
          color: var(--primary-text-color);
          overflow: hidden;
        }

        .session:hover {
          background-color: var(--additional-background-color);
        }

        .session-icon {
          width: 88px;
          height: 88px;
          color: var(--border-light-color);
          position: absolute;
          right: 40px;
          bottom: -4px;
        }

        .session-header,
        .session-content,
        .session-footer {
          padding: 16px;
          z-index: 1;
        }

        .session-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          padding-bottom: 8px;
        }

        .session-header-content {
          flex: 1;
          flex-basis: 1px;
        }

        .language {
          margin-left: 8px;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--secondary-text-color);
        }

        .session-content {
          display: flex;
          flex: 1;
          flex-basis: 1px;
          flex-direction: row;
          justify-content: space-between;
          padding-top: 0;
          padding-bottom: 40px;
        }

        .bookmark-session,
        .feedback-action {
          color: var(--secondary-text-color);
        }

        .session[featured] .bookmark-session {
          color: var(--default-primary-color);
        }

        .bookmark-session:hover,
        .feedback-action:hover {
          color: var(--default-primary-color);
        }

        .session-title {
          font-size: 20px;
          line-height: 1.2;
        }

        .session-description {
          margin-top: 8px;
        }

        .session-meta {
          margin: 0;
          padding: 0;
          font-size: 12px;
          color: var(--secondary-text-color);
        }

        .session-footer {
          font-size: 14px;
        }

        .session-footer-row {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-content: center;
        }

        .session-duration {
          flex: 1;
          flex-basis: 1px;
        }

        .speakers {
          margin-top: 10px;
        }

        .speaker {
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        .speaker:not(:last-of-type) {
          padding-bottom: 10px;
        }

        .speaker-photo {
          margin-right: 12px;
          --lazy-image-width: 32px;
          --lazy-image-height: 32px;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          background-color: var(--secondary-background-color);
          border-radius: 50%;
          overflow: hidden;
          transform: translateZ(0);
        }

        .speaker-details {
          flex: 1;
          flex-basis: 1px;
        }

        .speaker-name {
          margin-bottom: 4px;
          line-height: 1.2;
        }

        .speaker-title {
          font-size: 12px;
          line-height: 1;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
        }

        @media (min-width: 640px) {
          :host {
            border: 1px solid var(--border-light-color);
            border-top: 0;
          }
        }

        @media (min-width: 812px) {
          :host {
            border: 1px solid var(--border-light-color);
          }
        }
      `,
    ];
  }

  @property({ type: Object })
  user: UserState = new Initialized();
  @property({ type: Object })
  session: Session | undefined;
  @property({ type: Object })
  featuredSessions: FeaturedSessionsState = new Initialized();

  override stateChanged(state: RootState) {
    this.user = state.user;
    this.featuredSessions = selectFeaturedSessionsState(state);
  }

  override render() {
    const session = this.session as SessionWithScheduleDetails | undefined;
    const duration = session?.duration;
    const summary = this.getSummary();
    const isFeatured = this.isFeatured();
    const icon = isFeatured ? 'bookmark-check' : 'bookmark-plus';
    const acceptingSessionFeedback = this.isAcceptingFeedback();

    return html`
      <a class="session" href="${this.sessionUrl(session?.id)}" ?featured="${isFeatured}">
        <hoverboard-icon name="${ifDefined(session?.icon)}" class="session-icon"></hoverboard-icon>

        <div class="session-header">
          <div class="session-header-content">
            <h3 class="session-title">${session?.title}</h3>
            <text-truncate lines="3">
              <div class="session-description">${summary}</div>
            </text-truncate>
          </div>
          <span class="language">${session?.language?.slice(0, 2)}</span>
        </div>

        <div class="session-content">
          <div class="session-meta">
            <div ?hidden="${!session?.complexity}">${session?.complexity}</div>
          </div>
          <div class="session-actions">
            <hoverboard-icon
              name="insert-comment"
              class="feedback-action"
              ?hidden="${!acceptingSessionFeedback}"
              @click="${this.toggleFeedback}"
            ></hoverboard-icon>
            <hoverboard-icon
              name="${icon}"
              class="bookmark-session"
              ?hidden="${acceptingSessionFeedback}"
              @click="${this.toggleFeaturedSession}"
            ></hoverboard-icon>
          </div>
        </div>

        <div class="session-footer">
          <div class="session-footer-row">
            <div class="session-meta session-duration">
              <span ?hidden="${!duration?.hh}">
                ${duration?.hh} hour${this.getEnding(duration?.hh)}
              </span>
              <span ?hidden="${!duration?.mm}">
                ${duration?.mm} min${this.getEnding(duration?.mm)}
              </span>
            </div>
            <div class="tags" ?hidden="${!session?.tags?.length}">
              ${session?.tags?.map(
                (tag) =>
                  html`<span class="tag" style="color: ${this.getVariableColor(tag)}"
                    >${tag}</span
                  >`,
              )}
            </div>
          </div>

          <div class="speakers" ?hidden="${!session?.speakers?.length}">
            ${session?.speakers?.map(
              (speaker) => html`
                <div class="speaker">
                  <lazy-image
                    class="speaker-photo"
                    src="${speaker.photoUrl}"
                    alt="${speaker.name}"
                  ></lazy-image>

                  <div class="speaker-details">
                    <div class="speaker-name">${speaker.name}</div>
                    <div class="speaker-title">${this.join(speaker.company, speaker.country)}</div>
                  </div>
                </div>
              `,
            )}
          </div>
        </div>
      </a>
    `;
  }

  private isFeatured(): boolean {
    if (this.featuredSessions instanceof Success && this.session?.id) {
      return this.featuredSessions.data[this.session.id] ?? false;
    }
    return false;
  }

  private getEnding(number: number | undefined) {
    return number && number > 1 ? 's' : '';
  }

  private getSummary() {
    const description = this.session?.description ?? '';
    // TODO: Move logic to utility function
    const indexes = [
      description.indexOf('\n'),
      description.indexOf('<br'),
      description.length,
    ].filter((index) => index > 0);
    return description.slice(0, Math.min(...indexes));
  }

  private toggleFeaturedSession = (event: MouseEvent) => {
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
  };

  private toggleFeedback = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (this.session) {
      openFeedbackDialog(this.session);
    }
  };

  private isAcceptingFeedback(): boolean {
    return this.session !== undefined && acceptingFeedback(this.session);
  }

  private join(company: string, country: string) {
    return [company, country].filter(Boolean).join(' / ');
  }

  private getVariableColor(value: string) {
    return getVariableColor(this, value);
  }

  private sessionUrl(id: string | undefined) {
    return id ? router.urlForName('session-page', { id }) : '';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'session-element': SessionElement;
  }
}
