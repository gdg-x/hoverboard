import { Initialized, Success } from '@abraham/remotedata';
import { computed, customElement, observe, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-fab';
import '@polymer/paper-progress';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import { RouterLocation } from '@vaadin/router';
import '../components/hero/simple-hero';
import '../components/markdown/short-markdown';
import '../elements/feedback-block';
import '../elements/shared-styles';
import { Session } from '../models/session';
import { Speaker } from '../models/speaker';
import { router } from '../router';
import { RootState, store } from '../store';
import { initialAuthState } from '../store/auth/state';
import { openSigninDialog } from '../store/dialogs/actions';
import {
  fetchUserFeaturedSessions,
  setUserFeaturedSessions,
} from '../store/featured-sessions/actions';
import { initialFeaturedSessionsState } from '../store/featured-sessions/state';
import { ReduxMixin } from '../store/mixin';
import { fetchSessions } from '../store/sessions/actions';
import { selectSession } from '../store/sessions/selectors';
import { initialSessionsState, SessionsState } from '../store/sessions/state';
import { queueComplexSnackbar } from '../store/snackbars';
import { openVideoDialog } from '../store/ui/actions';
import { initialUiState } from '../store/ui/state';
import { initialUserState } from '../store/user/state';
import { UserState } from '../store/user/types';
import { TempAny } from '../temp-any';
import { disabledSchedule, feedback, schedule, sessionDetails } from '../utils/data';
import { acceptingFeedback } from '../utils/feedback';
import '../utils/icons';
import { updateImageMetadata } from '../utils/metadata';
import { getVariableColor } from '../utils/styles';

@customElement('session-page')
export class SessionPage extends ReduxMixin(PolymerElement) {
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

      <simple-hero page="schedule">
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
              on-click="toggleFeaturedSession"
            ></paper-fab>
          </div>
        </div>
      </simple-hero>

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
            on-click="toggleFeaturedSession"
          ></paper-fab>
        </div>
        <h3 class="meta-info" hidden$="[[disabledSchedule]]">
          [[session.dateReadable]], [[session.startTime]] - [[session.endTime]]
        </h3>
        <h3 class="meta-info" hidden$="[[disabledSchedule]]">[[session.track.title]]</h3>
        <h3 class="meta-info" hidden$="[[!session.complexity]]">
          [[sessionDetails.contentLevel]]: [[session.complexity]]
        </h3>

        <short-markdown class="description" content="[[session.description]]"></short-markdown>

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
            <span>[[sessionDetails.viewPresentation]]</span>
          </a>
          <div
            class="action"
            hidden$="[[!session.videoId]]"
            on-click="openVideo"
            layout
            horizontal
            center
          >
            <iron-icon icon="hoverboard:video"></iron-icon>
            [[sessionDetails.viewVideo]]
          </div>
        </div>

        <div class="additional-sections" hidden$="[[!session.speakers.length]]">
          <h3>[[sessionDetails.speakers]]</h3>
          <template is="dom-repeat" items="[[session.speakers]]" as="speaker">
            <a class="section" href$="[[speakerUrl(speaker.id)]]">
              <div layout horizontal center>
                <lazy-image
                  class="section-photo"
                  src="[[speaker.photoUrl]]"
                  alt="[[speaker.name]]"
                ></lazy-image>

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
          <h3>[[feedback.headline]]</h3>

          <auth-required hidden="[[!acceptingFeedback]]">
            <slot slot="prompt">[[feedback.leaveFeedback]]</slot>
            <feedback-block session-id="[[session.id]]"></feedback-block>
          </auth-required>

          <p hidden="[[acceptingFeedback]]">[[feedback.sessionClosed]]</p>
        </div>
      </div>

      <footer-block></footer-block>
    `;
  }

  private feedback = feedback;
  private sessionDetails = sessionDetails;

  @property({ type: Object })
  sessions = initialSessionsState;
  @property({ type: Object })
  session: Session | undefined;
  @property({ type: String })
  sessionId: string | undefined;
  @property({ type: Object })
  featuredSessions = initialFeaturedSessionsState;
  @property({ type: Object })
  user = initialUserState;
  @property({ type: Object })
  auth = initialAuthState;

  @property({ type: Object })
  private viewport = initialUiState.viewport;
  @property({ type: Boolean })
  private disabledSchedule: boolean = disabledSchedule;
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

  override connectedCallback() {
    super.connectedCallback();

    if (this.sessions instanceof Initialized) {
      store.dispatch(fetchSessions);
    }
  }

  @observe('user')
  private onUser(user: UserState) {
    if (user instanceof Success && this.featuredSessions instanceof Initialized) {
      store.dispatch(fetchUserFeaturedSessions);
    }
  }

  onAfterEnter(location: RouterLocation) {
    this.sessionId = location.params?.['id']?.toString();
  }

  @observe('session')
  private onContentLoaderVisibility(session: Session | undefined) {
    this.contentLoaderVisibility = !!session;
  }

  @observe('session')
  private onSession() {
    this.acceptingFeedback = this.session !== undefined && acceptingFeedback(this.session);
  }

  @computed('featuredSessions', 'sessionId')
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

  @observe('sessions', 'sessionId')
  private onSessionsAndSessionId(sessions: SessionsState, sessionId: string) {
    if (sessionId && sessions instanceof Success) {
      this.session = selectSession(store.getState(), sessionId);

      if (!this.session) {
        router.render('/404');
      } else {
        const speaker: Speaker = this.session?.speakers?.[0] as TempAny;
        updateImageMetadata(this.session.title, this.session.description, {
          image: speaker.photoUrl,
          imageAlt: speaker.name,
        });
      }
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
    return getVariableColor(this as unknown as PolymerElement, value);
  }

  private speakerUrl(id: string) {
    return router.urlForName('speaker-page', { id });
  }
}
