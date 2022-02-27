import { Initialized, Success } from '@abraham/remotedata';
import { computed, customElement, observe, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-progress';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import { RouterLocation } from '@vaadin/router';
import '../components/hero/simple-hero';
import '../components/markdown/short-markdown';
import '../elements/content-loader';
import '../elements/previous-speakers-block';
import '../elements/shared-styles';
import { PreviousSessionWithYear } from '../models/previous-session';
import { PreviousSpeaker } from '../models/previous-speaker';
import { router } from '../router';
import { RootState, store } from '../store';
import { ReduxMixin } from '../store/mixin';
import { fetchPreviousSpeakers } from '../store/previous-speakers/actions';
import { selectPreviousSpeaker } from '../store/previous-speakers/selectors';
import {
  initialPreviousSpeakersState,
  PreviousSpeakersState,
} from '../store/previous-speakers/state';
import { isEmpty } from '../utils/arrays';
import { sessionDetails, speakerDetails, speakers } from '../utils/data';
import '../utils/icons';
import { updateImageMetadata } from '../utils/metadata';
import { getVariableColor } from '../utils/styles';

@customElement('previous-speaker-page')
export class PreviousSpeakerPage extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          background: #fff;
          box-shadow: var(--box-shadow);
          color: var(--primary-text-color);
          display: block;
          height: 100%;
          margin: 0;
          width: 100%;
        }

        .content {
          position: relative;
          font-size: 15px;
          line-height: 1.87;
        }

        .photo {
          margin-right: 16px;
          --lazy-image-width: 96px;
          --lazy-image-height: 96px;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          overflow: hidden;
          border-radius: 50%;
          background-color: var(--contrast-additional-background-color);
          transform: translateZ(0);
          flex-shrink: 0;
        }

        .name {
          line-height: 1.2;
        }

        .subtitle {
          font-size: 16px;
          color: var(--secondary-text-color);
        }

        .badge:not(:last-of-type)::after {
          margin-left: -4px;
          content: ',';
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .star-rating {
          display: inline-block;
          vertical-align: middle;
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
          color: var(--secondary-text-color);
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

        paper-progress {
          width: 100%;
          --paper-progress-active-color: var(--default-primary-color);
          --paper-progress-secondary-color: var(--default-primary-color);
        }
      </style>

      <simple-hero page="speakers">
        <div class="dialog-container header-content" layout horizontal center>
          <lazy-image class="photo" src="[[speaker.photoUrl]]" alt="[[speaker.name]]"></lazy-image>
          <div>
            <h2 class="name" flex>[[speaker.name]]</h2>
            <div class="subtitle">[[subtitle]]</div>
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
        <h3 class="meta-info">[[companyInfo]]</h3>
        <h3 class="meta-info" hidden$="[[isEmpty(speaker.badges)]]">
          <template is="dom-repeat" items="[[speaker.badges]]" as="badge">
            <a
              class="badge"
              href$="[[badge.link]]"
              target="_blank"
              rel="noopener noreferrer"
              title$="[[badge.description]]"
            >
              [[badge.description]]
            </a>
          </template>
        </h3>

        <short-markdown class="description" content="[[speaker.bio]]"></short-markdown>

        <div class="actions" layout horizontal>
          <template is="dom-repeat" items="[[speaker.socials]]" as="social">
            <a class="action" href$="[[social.link]]" target="_blank" rel="noopener noreferrer">
              <iron-icon icon="hoverboard:[[social.icon]]"></iron-icon>
            </a>
          </template>
        </div>

        <div class="additional-sections" hidden$="[[!sessions.length]]">
          <h3>[[speakerDetails.sessions]]</h3>

          <template is="dom-repeat" items="[[sessions]]" as="session">
            <div layout horizontal center>
              <div class="section" flex>
                <div class="section-primary-text">[[session.title]]</div>
                <div class="section-secondary-text">[[previousYear]]: [[session.year]]</div>
                <div class="tags" hidden$="[[!session.tags.length]]">
                  <template is="dom-repeat" items="[[session.tags]]" as="tag">
                    <span class="tag" style$="color: [[getVariableColor(tag)]]">[[tag]]</span>
                  </template>
                </div>
                <div class="actions" layout horizontal>
                  <a
                    class="action"
                    href$="https://www.youtube.com/watch?v=[[session.videoId]]"
                    hidden$="[[!session.videoId]]"
                    target="_blank"
                    rel="noopener noreferrer"
                    layout
                    horizontal
                    center
                  >
                    <iron-icon icon="hoverboard:video"></iron-icon>
                    <span>[[sessionDetails.viewVideo]]</span>
                  </a>
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
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <previous-speakers-block></previous-speakers-block>

      <footer-block></footer-block>
    `;
  }

  private previousYear = speakers.previousYear;
  private sessionDetails = sessionDetails;
  private speakerDetails = speakerDetails;

  @property({ type: Object })
  speaker: PreviousSpeaker | undefined;
  @property({ type: Object })
  speakers = initialPreviousSpeakersState;

  @property({ type: String })
  private speakerId: string | undefined;
  @property({ type: String, computed: 'computeJoin(speaker.country, speaker.pronouns)' })
  private subtitle: string = '';
  @property({ type: String, computed: 'computeCompanyInfo(speaker.title, speaker.company)' })
  private companyInfo: string = '';

  override connectedCallback() {
    super.connectedCallback();

    if (this.speakers instanceof Initialized) {
      store.dispatch(fetchPreviousSpeakers);
    }
  }

  override stateChanged(state: RootState) {
    super.stateChanged(state);
    this.speakers = state.previousSpeakers;
  }

  onAfterEnter(location: RouterLocation) {
    this.speakerId = location.params?.['id']?.toString();
  }

  @computed('speaker')
  get contentLoaderVisibility() {
    return !!this.speaker;
  }

  @observe('speakers', 'speakerId')
  onSpeakersAndSpeakerId(speakers: PreviousSpeakersState, speakerId: string) {
    if (speakerId && speakers instanceof Success) {
      this.speaker = selectPreviousSpeaker(store.getState(), speakerId);
      if (!this.speaker) {
        router.render('/404');
      } else {
        updateImageMetadata(this.speaker.name, this.speaker.bio, {
          image: this.speaker.photoUrl,
          imageAlt: this.speaker.name,
        });
      }
    }
  }

  private computeJoin(...values: string[]) {
    return values.filter(Boolean).join(' • ');
  }

  private computeCompanyInfo(title: string, company: string) {
    return [title, company].filter(Boolean).join(', ');
  }

  private getVariableColor(value: string) {
    return getVariableColor(this as unknown as PolymerElement, value);
  }

  private isEmpty(items: unknown[]) {
    return isEmpty(items);
  }

  @computed('speaker')
  private get sessions(): PreviousSessionWithYear[] {
    // TODO: Move to selector
    if (!this.speaker) {
      return [];
    }

    let sessions: PreviousSessionWithYear[] = [];

    for (const [year, previousSessions] of Object.entries(this.speaker.sessions)) {
      sessions = [...sessions, ...previousSessions.map((session) => ({ ...session, year }))];
    }

    return sessions.sort((a, b) => Number(b.year) - Number(a.year));
  }
}
