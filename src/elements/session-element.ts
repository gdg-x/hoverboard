import { Success } from '@abraham/remotedata';
import { computed, customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import '../components/text-truncate';
import { Session } from '../models/session';
import { router } from '../router';
import { RootState, store } from '../store';
import { openFeedbackDialog, openSigninDialog } from '../store/dialogs/actions';
import { setUserFeaturedSessions } from '../store/featured-sessions/actions';
import { initialFeaturedSessionsState } from '../store/featured-sessions/state';
import { ReduxMixin } from '../store/mixin';
import { queueComplexSnackbar } from '../store/snackbars';
import { initialUserState } from '../store/user/state';
import { schedule } from '../utils/data';
import { acceptingFeedback } from '../utils/feedback';
import '../utils/icons';
import { getVariableColor } from '../utils/styles';
import './shared-styles';

@customElement('session-element')
export class SessionElement extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          display: block;
          background-color: var(--primary-background-color);
          border-bottom: 1px solid var(--border-light-color);
          height: 100%;
          border-radius: var(--border-radius);
        }

        .session {
          height: 100%;
          color: var(--primary-text-color);
          overflow: hidden;
        }

        .session:hover {
          background-color: var(--additional-background-color);
        }

        .session-icon {
          --iron-icon-width: 88px;
          --iron-icon-height: 88px;
          --iron-icon-fill-color: var(--border-light-color);
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
          padding-bottom: 8px;
        }

        .language {
          margin-left: 0;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--secondary-text-color);
        }

        .session-content {
          padding-top: 0;
          padding-bottom: 40px;
        }

        .backgroundImage {
          --lazy-image-fit: cover;
        }

        .session[with-background] {
          color: #fff;
        }
        .session[with-background] > .backgroundImage {
          filter: brightness(60%);
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

        .session-title-container {
          min-width: 0px;
          word-wrap: break-word;
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

        .speakers {
          margin-top: 10px;
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

          min-width: 32px;
          min-height: 32px;
        }

        .speaker-details {
          min-width: 0px;
        }

        .speaker-name,
        .speaker-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          min-width: 0px;
        }

        .tag {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
      </style>

      <a
        class="session"
        href$="[[sessionUrl(session.id)]]"
        featured$="[[isFeatured]]"
        with-background$="[[session.image]]"
        layout
        vertical
        relative
      >
        <lazy-image
          class="backgroundImage"
          src="[[session.image]]"
          imageFit="cover"
          hidden="[[!session.image]]"
          fit
          preload
        ></lazy-image>

        <iron-icon icon="hoverboard:[[session.icon]]" class="session-icon"></iron-icon>

        <div class="session-header" layout horizontal justified>
          <div flex class="session-title-container">
            <h3 class="session-title">[[session.title]]</h3>
            <text-truncate lines="3">
              <div class="session-description">[[summary]]</div>
            </text-truncate>
          </div>
        </div>

        <div class="session-content" flex layout horizontal justified>
          <div class="session-meta">
            <span class="language" hidden="[[session.hideTrackTitle]]"
              >[[session.track.title]]</span
            >
            <div hidden$="[[!session.complexity]]">[[session.complexity]]</div>
          </div>
          <div class="session-actions">
            <iron-icon
              icon="hoverboard:insert-comment"
              class="feedback-action"
              hidden="[[!acceptingFeedback()]]"
              on-click="toggleFeedback"
            ></iron-icon>
            <iron-icon
              icon="hoverboard:[[icon]]"
              class="bookmark-session"
              hidden="[[acceptingFeedback()]]"
              on-click="toggleFeaturedSession"
            ></iron-icon>
          </div>
        </div>

        <div class="session-footer">
          <div layout horizontal justified center-aligned center-center>
            <div class="session-meta" flex>
              <span hidden$="[[!session.duration.hh]]">
                [[session.duration.hh]] hour[[getEnding(session.duration.hh)]]
              </span>
              <span hidden$="[[!session.duration.mm]]">
                [[session.duration.mm]] min[[getEnding(session.duration.mm)]]
              </span>
            </div>
            <div class="tags" hidden$="[[!session.tags.length]]">
              <template is="dom-repeat" items="[[session.tags]]" as="tag">
                <span class="tag" style$="color: [[getVariableColor(tag)]]" title="[[tag]]"
                  >[[tag]]</span
                >
              </template>
            </div>
          </div>

          <div class="speakers" hidden$="[[!session.speakers.length]]">
            <template is="dom-repeat" items="[[session.speakers]]" as="speaker">
              <div class="speaker" layout horizontal center>
                <lazy-image
                  class="speaker-photo"
                  src="[[speaker.photoUrl]]"
                  alt="[[speaker.name]]"
                ></lazy-image>

                <div class="speaker-details" flex>
                  <div class="speaker-name" title="[[speaker.name]]">[[speaker.name]]</div>
                  <div class="speaker-title" title="[[join(speaker.company, speaker.country)]]">
                    [[join(speaker.company, speaker.country)]]
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </a>
    `;
  }

  @property({ type: Object })
  user = initialUserState;
  @property({ type: Object })
  session: Session | undefined;
  @property({ type: Object })
  featuredSessions = initialFeaturedSessionsState;
  @property({ type: String })
  private queryParams: string | undefined;
  @property({ type: String })
  private dayName: string | undefined;

  override stateChanged(state: RootState) {
    this.user = state.user;
    this.featuredSessions = state.featuredSessions;
  }

  @computed('featuredSessions', 'session')
  get isFeatured(): boolean {
    if (this.featuredSessions instanceof Success && this.session?.id) {
      return this.featuredSessions.data[this.session.id] ?? false;
    }
    return false;
  }

  @computed('isFeatured')
  private get icon() {
    return this.isFeatured ? 'bookmark-check' : 'bookmark-plus';
  }

  private getEnding(number: number) {
    return number > 1 ? 's' : '';
  }

  @computed('session')
  private get summary() {
    const description = this.session?.description ?? '';
    // TODO: Move logic to utility function
    const indexes = [
      description.indexOf('\n'),
      description.indexOf('<br'),
      description.length,
    ].filter((index) => index > 0);
    return description.slice(0, Math.min(...indexes));
  }

  private toggleFeaturedSession(event: MouseEvent) {
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
        })
      );
      return;
    }

    if (this.user instanceof Success && this.featuredSessions instanceof Success && this.session) {
      const bookmarked = !this.featuredSessions.data[this.session.id];
      const sessions = {
        ...this.featuredSessions.data,
        [this.session.id]: bookmarked,
      };

      store.dispatch(setUserFeaturedSessions(this.user.data.uid, sessions, bookmarked));
    }
  }

  private toggleFeedback(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.session) {
      openFeedbackDialog(this.session);
    }
  }

  private acceptingFeedback(): boolean {
    return this.session !== undefined && acceptingFeedback(this.session);
  }

  private join(company: string, country: string) {
    return [company, country].filter(Boolean).join(' / ');
  }

  private getVariableColor(value: string) {
    return getVariableColor(this, value);
  }

  private slice(text: string, number: number) {
    return text && text.slice(0, number);
  }

  private sessionUrl(id: string) {
    return router.urlForName('session-page', { id });
  }
}
