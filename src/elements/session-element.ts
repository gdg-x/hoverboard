import { Success } from '@abraham/remotedata';
import { customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { ReduxMixin } from '../mixins/redux-mixin';
import { Session } from '../models/session';
import { router } from '../router';
import { RootState, store } from '../store';
import { openDialog } from '../store/dialogs/actions';
import { DIALOG } from '../store/dialogs/types';
import { setUserFeaturedSessions } from '../store/featured-sessions/actions';
import {
  FeaturedSessionsState,
  initialFeaturedSessionsState,
} from '../store/featured-sessions/state';
import { showToast } from '../store/toast/actions';
import { initialUserState } from '../store/user/state';
import { UserState } from '../store/user/types';
import { getVariableColor, toggleQueryParam } from '../utils/functions';
import './shared-styles';
import './text-truncate';

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
          margin-left: 8px;
          font-size: 12px;
          text-transform: uppercase;
          color: var(--secondary-text-color);
        }

        .session-content {
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

        .speakers {
          margin-top: 10px;
        }

        .speaker:not(:last-of-type) {
          padding-bottom: 10px;
        }

        .speaker-photo {
          margin-right: 12px;
          width: 32px;
          height: 32px;
          background-color: var(--secondary-background-color);
          border-radius: 50%;
          overflow: hidden;
          transform: translateZ(0);
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
      </style>

      <a
        class="session"
        href$="[[sessionUrl(session.id)]]"
        featured$="[[isFeatured]]"
        layout
        vertical
        relative
      >
        <iron-icon class="session-icon" icon="hoverboard:[[session.icon]]"></iron-icon>

        <div class="session-header" layout horizontal justified>
          <div flex>
            <h3 class="session-title">[[session.title]]</h3>
            <text-truncate lines="3">
              <div class="session-description">[[summary]]</div>
            </text-truncate>
          </div>
          <span class="language">[[slice(session.language, 2)]]</span>
        </div>

        <div class="session-content" flex layout horizontal justified>
          <div class="session-meta">
            <div hidden$="[[!session.complexity]]">[[session.complexity]]</div>
          </div>
          <div class="session-actions">
            <iron-icon
              class="feedback-action"
              hidden="[[!_acceptingFeedback()]]"
              icon="hoverboard:insert-comment"
              on-click="_toggleFeedback"
            ></iron-icon>
            <iron-icon
              class="bookmark-session"
              hidden="[[_acceptingFeedback()]]"
              icon="hoverboard:[[icon]]"
              on-click="_toggleFeaturedSession"
            ></iron-icon>
          </div>
        </div>

        <div class="session-footer">
          <div layout horizontal justified center-aligned>
            <div class="session-meta" flex>
              <span hidden$="[[!session.duration.hh]]">
                [[session.duration.hh]] hour[[_getEnding(session.duration.hh)]]
              </span>
              <span hidden$="[[!session.duration.mm]]">
                [[session.duration.mm]] min[[_getEnding(session.duration.mm)]]
              </span>
            </div>
            <div class="tags" hidden$="[[!session.tags.length]]">
              <template is="dom-repeat" items="[[session.tags]]" as="tag">
                <span class="tag" style$="color: [[getVariableColor(tag)]]">[[tag]]</span>
              </template>
            </div>
          </div>

          <div class="speakers" hidden$="[[!session.speakers.length]]">
            <template is="dom-repeat" items="[[session.speakers]]" as="speaker">
              <div class="speaker" layout horizontal center>
                <plastic-image
                  class="speaker-photo"
                  srcset="[[speaker.photoUrl]]"
                  sizing="cover"
                  lazy-load
                  preload
                  fade
                ></plastic-image>

                <div class="speaker-details" flex>
                  <div class="speaker-name">[[speaker.name]]</div>
                  <div class="speaker-title">[[_join(speaker.company, speaker.country)]]</div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </a>
    `;
  }

  @property({ type: Object })
  private user = initialUserState;
  @property({ type: Object })
  private session: Session;
  @property({ type: Object })
  private featuredSessions = initialFeaturedSessionsState;
  @property({ type: String })
  private queryParams: string;
  @property({ type: String })
  private dayName: string;
  @property({ type: String, computed: 'getVariableColor(session.mainTag)' })
  private sessionCollor: string;
  @property({ type: Boolean, computed: '_isFeatured(user, featuredSessions, session.id)' })
  private isFeatured: boolean;
  @property({ type: String, computed: '_summary(session.description)' })
  private summary: string;
  @property({ type: String, computed: '_icon(isFeatured)' })
  private icon: string;

  override stateChanged(state: RootState) {
    this.user = state.user;
    this.featuredSessions = state.featuredSessions;
  }

  _isFeatured(user: UserState, featuredSessions: FeaturedSessionsState, sessionId?: string) {
    if (user instanceof Success && featuredSessions instanceof Success && sessionId) {
      return featuredSessions.data[sessionId];
    }
    return false;
  }

  _icon(isFeatured: boolean) {
    return isFeatured ? 'bookmark-check' : 'bookmark-plus';
  }

  _getEnding(number: number) {
    return number > 1 ? 's' : '';
  }

  _summary(description = '') {
    const indexes = [
      description.indexOf('\n'),
      description.indexOf('<br'),
      description.length,
    ].filter((index) => index > 0);
    return description.slice(0, Math.min(...indexes));
  }

  _toggleFeaturedSession(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!(this.user instanceof Success)) {
      showToast({
        message: '{$ schedule.saveSessionsSignedOut $}',
        action: {
          title: 'Sign in',
          callback: () => openDialog(DIALOG.SIGNIN),
        },
      });
      return;
    }

    if (this.user instanceof Success && this.featuredSessions instanceof Success) {
      const sessions = {
        ...this.featuredSessions.data,
        [this.session.id]: !this.featuredSessions.data[this.session.id],
      };

      store.dispatch(setUserFeaturedSessions(this.user.data.uid, sessions));
    }
  }

  _toggleFeedback(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    openDialog(DIALOG.FEEDBACK, this.session);
  }

  _acceptingFeedback() {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const ONE_MINUTE_MS = 60 * 1000;
    const now = new Date();
    const convertedTimezoneDate = new Date(
      new Date(`${this.session.day} ${this.session.startTime}`).getTime() +
        (parseInt('{$ timezoneOffset $}') - now.getTimezoneOffset()) * ONE_MINUTE_MS
    );

    const diff = now.getTime() - convertedTimezoneDate.getTime();
    return diff > 0 && diff < ONE_WEEK_MS;
  }

  _join(company: string, country: string) {
    return [company, country].filter(Boolean).join(' / ');
  }

  toggleQueryParam(currentQueryParams, key, value) {
    return toggleQueryParam(currentQueryParams, key, value);
  }

  getVariableColor(value) {
    return getVariableColor(this, value);
  }

  slice(text: string, number: number) {
    return text && text.slice(0, number);
  }

  sessionUrl(id: string) {
    return router.urlForName('session-page', { id });
  }
}
