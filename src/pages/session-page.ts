import { Initialized, Success } from '@abraham/remotedata';
import { computed, customElement, observe, property } from '@polymer/decorators';
import '@polymer/marked-element';
import '@polymer/paper-progress';
import { html, PolymerElement } from '@polymer/polymer';
import { RouterLocation } from '@vaadin/router';
import '../elements/feedback-block';
import '../elements/shared-styles';
import '../elements/text-truncate';
import { ReduxMixin } from '../mixins/redux-mixin';
import { SessionsMixin } from '../mixins/sessions-mixin';
import { Session } from '../models/session';
import { router } from '../router';
import { RootState, store } from '../store';
import { initialAuthState } from '../store/auth/state';
import { openDialog } from '../store/dialogs/actions';
import { DIALOG } from '../store/dialogs/types';
import {
  fetchUserFeaturedSessions,
  setUserFeaturedSessions,
} from '../store/featured-sessions/actions';
import { initialFeaturedSessionsState } from '../store/featured-sessions/state';
import { selectSession } from '../store/sessions/selectors';
import { SessionsState } from '../store/sessions/state';
import { showToast } from '../store/toast/actions';
import { toggleVideoDialog } from '../store/ui/actions';
import { initialUiState } from '../store/ui/state';
import { initialUserState } from '../store/user/state';
import { UserState } from '../store/user/types';
import { getVariableColor } from '../utils/functions';

@customElement('session-page')
export class SessionPage extends SessionsMixin(ReduxMixin(PolymerElement)) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          margin: 0;
          display: block;
          height: 100%;
          width: 100%;
          background: #fff;
          color: var(--primary-text-color);
        }

        app-header {
          background-color: var(--additional-background-color);
        }

        app-toolbar {
          padding: 0;
          height: auto;
        }

        .close-icon {
          margin: 24px 24px 24px;
          cursor: pointer;
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

        .action iron-icon {
          margin-right: 4px;
          --iron-icon-width: 18px;
          --iron-icon-height: 18px;
        }

        .additional-sections {
          margin-top: 32px;
        }

        .section {
          margin-top: 16px;
          display: block;
          color: var(--primary-text-color);
        }

        .section-photo {
          margin-right: 16px;
          width: 48px;
          height: 48px;
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
          .close-icon {
            margin: 16px;
            position: absolute;
            top: -8px;
            right: -48px;
            --iron-icon-fill-color: #fff;
          }

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

        .section {
          cursor: pointer;
        }

        .star-rating {
          display: inline-block;
          vertical-align: middle;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
        }

        paper-progress {
          width: 100%;
          --paper-progress-active-color: var(--default-primary-color);
          --paper-progress-secondary-color: var(--default-primary-color);
        }
      </style>

      <polymer-helmet
        title="[[session.title]] | {$ title $}"
        description="[[session.description]]"
        image="[[session.speakers.0.photoUrl]]"
        label1="{$ time $}"
        data1="[[session.dateReadable]], [[session.startTime]] - [[session.endTime]]"
        label2="{$ sessionDetails.contentLevel $}"
        data2="[[session.complexity]]"
      ></polymer-helmet>

      <hero-block
        background-image="{$ heroSettings.schedule.background.image $}"
        background-color="{$ heroSettings.schedule.background.color $}"
        font-color="{$ heroSettings.schedule.fontColor $}"
      >
        <div class="header-content" layout vertical end-justified>
          <h2 class="name">[[session.title]]</h2>
          <div class="tags" hidden$="[[!session.tags.length]]">
            <template is="dom-repeat" items="[[session.tags]]" as="tag">
              <span class="tag" style$="color: [[getVariableColor(tag)]]">[[tag]]</span>
            </template>
          </div>

          <div class="float-button" hidden$="[[!contentLoaderVisibility]]">
            <paper-fab
              icon="hoverboard:[[featuredSessionIcon]]"
              hidden$="[[!viewport.isLaptopPlus]]"
              on-click="_toggleFeaturedSession"
            ></paper-fab>
          </div>
        </div>
      </hero-block>

      <paper-progress indeterminate hidden$="[[contentLoaderVisibility]]"></paper-progress>

      <content-loader
        class="container"
        card-padding="32px"
        card-height="400px"
        horizontal-position="50%"
        border-radius="4px"
        box-shadow="var(--box-shadow)"
        items-count="1"
        hidden$="[[contentLoaderVisibility]]"
      ></content-loader>

      <div class="container content">
        <div class="float-button" hidden$="[[!contentLoaderVisibility]]">
          <paper-fab
            icon="hoverboard:[[featuredSessionIcon]]"
            hidden$="[[viewport.isLaptopPlus]]"
            on-click="_toggleFeaturedSession"
          ></paper-fab>
        </div>
        <h3 class="meta-info" hidden$="[[disabledSchedule]]">
          [[session.dateReadable]], [[session.startTime]] - [[session.endTime]]
        </h3>
        <h3 class="meta-info" hidden$="[[disabledSchedule]]">[[session.track.title]]</h3>
        <h3 class="meta-info" hidden$="[[!session.complexity]]">
          {$ sessionDetails.contentLevel $}: [[session.complexity]]
        </h3>

        <marked-element class="description" markdown="[[session.description]]">
          <div slot="markdown-html"></div>
        </marked-element>

        <div class="actions" layout horizontal>
          <a
            class="action"
            href$="[[session.presentation]]"
            hidden$="[[!session.presentation]]"
            target="_blank"
            rel="noopener noreferrer"
            layout
            horizontal
            center
          >
            <iron-icon icon="hoverboard:presentation"></iron-icon>
            <span>{$ sessionDetails.viewPresentation $}</span>
          </a>
          <div
            class="action"
            hidden$="[[!session.videoId]]"
            on-click="_openVideo"
            layout
            horizontal
            center
          >
            <iron-icon icon="hoverboard:video"></iron-icon>
            {$ sessionDetails.viewVideo $}
          </div>
        </div>

        <div class="additional-sections" hidden$="[[!session.speakers.length]]">
          <h3>{$ sessionDetails.speakers $}</h3>
          <template is="dom-repeat" items="[[session.speakers]]" as="speaker">
            <a class="section" href$="[[speakerUrl(speaker.id)]]">
              <div layout horizontal center>
                <plastic-image
                  class="section-photo"
                  srcset="[[speaker.photoUrl]]"
                  sizing="cover"
                  lazy-load
                  preload
                  fade
                ></plastic-image>

                <div class="section-details" flex>
                  <div class="section-primary-text">[[speaker.name]]</div>
                  <div class="section-secondary-text">
                    [[speaker.company]] / [[speaker.country]]
                  </div>
                </div>
              </div>
            </a>
          </template>
        </div>

        <div id="feedback" class="additional-sections">
          <h3>{$ feedback.headline $}</h3>

          <auth-required hidden="[[!acceptingFeedback]]">
            <slot slot="prompt">{$ feedback.leaveFeedback $}</slot>
            <feedback-block session-id="[[session.id]]"></feedback-block>
          </auth-required>

          <p hidden="[[acceptingFeedback]]">{$ feedback.sessionClosed $}</p>
        </div>
      </div>

      <footer-block></footer-block>
    `;
  }

  @property({ type: Object })
  session: Session;
  @property({ type: String })
  sessionId: string;
  @property({ type: Object })
  featuredSessions = initialFeaturedSessionsState;
  @property({ type: Object })
  user = initialUserState;
  @property({ type: Object })
  auth = initialAuthState;

  @property({ type: Object })
  private viewport = initialUiState.viewport;
  @property({ type: Boolean })
  private disabledSchedule: boolean = JSON.parse('{$ disabledSchedule $}');
  @property({ type: Boolean })
  private contentLoaderVisibility: boolean = false;
  @property({ type: Boolean })
  private acceptingFeedback: boolean = false;

  override stateChanged(state: RootState) {
    super.stateChanged(state);
    this.sessions = state.sessions;
    this.user = state.user;
    this.auth = state.auth;
    this.featuredSessions = state.featuredSessions;
    this.viewport = state.ui.viewport;
  }

  @observe('user')
  onUserId(user: UserState) {
    if (user instanceof Success && this.featuredSessions instanceof Initialized) {
      store.dispatch(fetchUserFeaturedSessions);
    }
  }

  onAfterEnter(location: RouterLocation) {
    this.sessionId = location.params.id.toString();
  }

  @observe('session')
  onContentLoaderVisibility(session: Session | undefined) {
    this.contentLoaderVisibility = !!session;
  }

  @observe('session')
  onAcceptingFeedback() {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const ONE_MINUTE_MS = 60 * 1000;
    const { day, startTime } = this.session;

    if (day && startTime) {
      const now = new Date();
      const currentTime = new Date(`${day} ${startTime}`).getTime();
      const timezoneOffset = parseInt('{$ timezoneOffset $}') - now.getTimezoneOffset();
      const convertedTimezoneDate = new Date(currentTime + timezoneOffset * ONE_MINUTE_MS);
      const diff = now.getTime() - convertedTimezoneDate.getTime();
      this.acceptingFeedback = diff > 0 && diff < ONE_WEEK_MS;
    } else {
      this.acceptingFeedback = false;
    }
  }

  @computed('featuredSessions', 'sessionId')
  get featuredSessionIcon() {
    if (this.featuredSessions instanceof Success && this.featuredSessions.data[this.sessionId]) {
      return 'bookmark-check';
    } else {
      return 'bookmark-plus';
    }
  }

  @observe('sessions', 'sessionId')
  onSessionsAndSessionId(sessions: SessionsState, sessionId: string) {
    if (sessionId && sessions instanceof Success) {
      this.session = selectSession(store.getState(), sessionId);

      if (!this.session) {
        router.render('/404');
      }
    }
  }

  _toggleFeaturedSession(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!(this.auth instanceof Success)) {
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

  private _openVideo() {
    toggleVideoDialog({
      title: this.session.title,
      youtubeId: this.session.videoId,
      disableControls: true,
      opened: true,
    });
  }

  private getVariableColor(value: string) {
    return getVariableColor(this as unknown as PolymerElement, value);
  }

  speakerUrl(id: string) {
    return router.urlForName('speaker-page', { id });
  }
}
