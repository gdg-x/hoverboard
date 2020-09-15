import '@polymer/iron-icon';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { ReduxMixin } from '../mixins/redux-mixin';
import { dialogsActions, sessionsActions, toastActions } from '../redux/actions';
import { DIALOGS } from '../redux/constants';
import { store } from '../redux/store';
import { TempAny } from '../temp-any';
import { getVariableColor, toggleQueryParam } from '../utils/functions';
import './shared-styles';
import './text-truncate';

class SessionElement extends ReduxMixin(PolymerElement) {
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
        href$="/schedule/[[dayName]]?[[toggleQueryParam(queryParams, 'sessionId', session.id)]]"
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
              icon="hoverboard:[[_getFeaturedSessionIcon(featuredSessions, session.id)]]"
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
            <div hidden$="[[!session.tags.length]]">
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

  static get is() {
    return 'session-element';
  }

  private user: { uid?: string; signedIn?: boolean } = {};
  private session: {
    id?: string;
    day?: TempAny;
    startTime?: TempAny;
  } = {};
  private featuredSessions = {};
  private queryParams: string;
  private sessionColor: string;
  private isFeatured: string;
  private summary: string;
  private dayName: string;

  static get properties() {
    return {
      user: Object,
      session: Object,
      featuredSessions: Object,
      queryParams: String,
      dayName: String,
      sessionColor: {
        type: String,
        computed: 'getVariableColor(session.mainTag)',
      },
      isFeatured: {
        type: String,
        computed: '_isFeatured(featuredSessions, session.id)',
      },
      summary: {
        type: String,
        computed: '_summary(session.description)',
      },
    };
  }

  _isFeatured(featuredSessions, sessionId) {
    if (!featuredSessions || !sessionId) return false;
    return featuredSessions[sessionId];
  }

  _getEnding(number) {
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

  _getFeaturedSessionIcon(featuredSessions, sessionId) {
    return this.isFeatured ? 'bookmark-check' : 'bookmark-plus';
  }

  _toggleFeaturedSession(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.user.signedIn) {
      toastActions.showToast({
        message: '{$ schedule.saveSessionsSignedOut $}',
        action: {
          title: 'Sign in',
          callback: () => {
            dialogsActions.openDialog(DIALOGS.SIGNIN);
          },
        },
      });
      return;
    }

    const sessions = Object.assign({}, this.featuredSessions, {
      [this.session.id]: !this.featuredSessions[this.session.id] ? true : null,
    });

    store.dispatch(sessionsActions.setUserFeaturedSessions(this.user.uid, sessions));
  }

  _toggleFeedback(event) {
    event.preventDefault();
    event.stopPropagation();
    dialogsActions.openDialog(DIALOGS.FEEDBACK, this.session);
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

  _join(company, country) {
    return [company, country].filter(Boolean).join(' / ');
  }

  toggleQueryParam(currentQueryParams, key, value) {
    return toggleQueryParam(currentQueryParams, key, value);
  }

  getVariableColor(value) {
    return getVariableColor(this, value);
  }

  slice(text, number) {
    return text && text.slice(0, number);
  }
}

window.customElements.define(SessionElement.is, SessionElement);
