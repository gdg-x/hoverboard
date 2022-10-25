import { Initialized, Success } from '@abraham/remotedata';
import { computed, customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import '../components/text-truncate';
import { Speaker } from '../models/speaker';
import { router } from '../router';
import { RootState, store } from '../store';
import { ReduxMixin } from '../store/mixin';
import { fetchSpeakers } from '../store/speakers/actions';
import { initialSpeakersState } from '../store/speakers/state';
import { randomOrder } from '../utils/arrays';
import { speakersBlock } from '../utils/data';
import '../utils/icons';
import './shared-styles';

@customElement('speakers-block')
export class SpeakersBlock extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          display: block;
        }

        .speakers-wrapper {
          margin: 40px 0 32px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-gap: 32px 16px;
        }

        .speaker {
          text-align: center;
        }

        .photo {
          display: inline-block;
          --lazy-image-width: 72px;
          --lazy-image-height: 72px;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          background-color: var(--accent-color);
          border-radius: 50%;
          overflow: hidden;
          transform: translateZ(0);
        }

        .badges {
          position: absolute;
          top: 0;
          left: calc(50% + 24px);
        }

        .badge {
          margin-left: -10px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #fff;
          transition: transform var(--animation);
        }

        .badge:hover {
          transform: scale(1.1);
        }

        .badge:nth-of-type(2) {
          transform: translate(0, 100%);
        }

        .badge:nth-of-type(2):hover {
          transform: translate3d(0, 100%, 20px) scale(1.1);
        }

        .badge-icon {
          --iron-icon-width: 12px;
          --iron-icon-height: 12px;
          color: #fff;
        }

        .company-logo {
          margin-top: 6px;
          --lazy-image-width: 100%;
          --lazy-image-height: 16px;
          --lazy-image-fit: contain;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
        }

        .description {
          color: var(--primary-text-color);
        }

        .name {
          margin-top: 8px;
          line-height: 1.1;
        }

        .origin {
          margin-top: 4px;
          font-size: 14px;
          line-height: 1.1;
        }

        .cta-button {
          margin-top: 24px;
        }

        @media (min-width: 640px) {
          .photo {
            --lazy-image-width: 128px;
            --lazy-image-height: 128px;
          }

          .name {
            font-size: 24px;
          }
        }

        @media (min-width: 812px) {
          .speakers-wrapper {
            grid-template-columns: repeat(3, 1fr);
          }

          .speaker:last-of-type {
            display: none;
          }

          .badges {
            left: calc(50% + 32px);
          }

          .badge:nth-of-type(2) {
            transform: translate(25%, 75%);
          }

          .badge:nth-of-type(2):hover {
            transform: translate3d(25%, 75%, 20px) scale(1.1);
          }

          .badge:nth-of-type(3) {
            transform: translate(10%, 180%);
          }

          .badge:nth-of-type(3):hover {
            transform: translate3d(10%, 180%, 20px) scale(1.1);
          }
        }

        @media (min-width: 1024px) {
          .speakers-wrapper {
            grid-template-columns: repeat(4, 1fr);
          }

          .speaker:last-of-type {
            display: block;
          }
        }
      </style>

      <div class="container">
        <h1 class="container-title">[[speakersBlock.title]]</h1>

        <div class="speakers-wrapper">
          <template is="dom-repeat" items="[[featuredSpeakers]]" as="speaker">
            <a class="speaker" href$="[[speakerUrl(speaker.id)]]">
              <div relative>
                <lazy-image
                  class="photo"
                  src="[[speaker.photoUrl]]"
                  alt="[[speaker.name]]"
                ></lazy-image>
                <div class="badges" layout horizontal>
                  <template is="dom-repeat" items="[[speaker.badges]]" as="badge">
                    <a
                      class$="badge [[badge.name]]-b"
                      href$="[[badge.link]]"
                      target="_blank"
                      rel="noopener noreferrer"
                      title$="[[badge.description]]"
                      layout
                      horizontal
                      center-center
                    >
                      <iron-icon icon="hoverboard:[[badge.name]]" class="badge-icon"></iron-icon>
                    </a>
                  </template>
                </div>
              </div>

              <lazy-image
                class="company-logo"
                src="[[speaker.companyLogoUrl]]"
                alt="[[speaker.company]]"
              ></lazy-image>

              <div class="description">
                <text-truncate lines="1">
                  <h3 class="name">[[speaker.name]]</h3>
                </text-truncate>
                <text-truncate lines="1">
                  <div class="origin">[[speaker.country]]</div>
                </text-truncate>
              </div>
            </a>
          </template>
        </div>

        <a href="[[speakersBlock.callToAction.link]]">
          <paper-button class="cta-button animated icon-right">
            <span>[[speakersBlock.callToAction.label]]</span>
            <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
          </paper-button>
        </a>
      </div>
    `;
  }

  @property({ type: Object })
  speakers = initialSpeakersState;

  private speakersBlock = speakersBlock;

  override connectedCallback() {
    super.connectedCallback();

    if (this.speakers instanceof Initialized) {
      store.dispatch(fetchSpeakers);
    }
  }

  override stateChanged(state: RootState) {
    super.stateChanged(state);
    this.speakers = state.speakers;
  }

  @computed('speakers')
  get featuredSpeakers(): Speaker[] {
    if (this.speakers instanceof Success) {
      const { data } = this.speakers;
      const filteredSpeakers = data.filter((speaker) => speaker.featured);
      const randomSpeakers = randomOrder(filteredSpeakers.length ? filteredSpeakers : data);
      return randomSpeakers.slice(0, 4);
    } else {
      return [];
    }
  }

  speakerUrl(id: string) {
    return router.urlForName('speaker-page', { id });
  }
}
