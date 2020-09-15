import '@polymer/iron-icon';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { ReduxMixin } from '../mixins/redux-mixin';
import { SpeakersHoC } from '../mixins/speakers-hoc';
import { State } from '../redux/store';
import { randomOrder } from '../utils/functions';
import './shared-styles';
import './text-truncate';

class SpeakersBlock extends SpeakersHoC(ReduxMixin(PolymerElement)) {
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
          cursor: pointer;
        }

        .photo {
          width: 72px;
          height: 72px;
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
          width: 100%;
          height: 16px;
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
            width: 128px;
            height: 128px;
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
        <h1 class="container-title">{$ speakersBlock.title $}</h1>

        <div class="speakers-wrapper">
          <template is="dom-repeat" items="[[featuredSpeakers]]" as="speaker">
            <div
              class="speaker"
              on-click="_openSpeaker"
              ga-on="click"
              ga-event-category="speaker"
              ga-event-action="open details"
              ga-event-label$="[[speaker.name]]"
            >
              <div relative>
                <plastic-image
                  class="photo"
                  srcset="[[speaker.photoUrl]]"
                  sizing="cover"
                  lazy-load
                  preload
                  fade
                ></plastic-image>
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
                      <iron-icon class="badge-icon" icon="hoverboard:[[badge.name]]"></iron-icon>
                    </a>
                  </template>
                </div>
              </div>

              <plastic-image
                class="company-logo"
                srcset="{{speaker.companyLogoUrl}}"
                sizing="contain"
                lazy-load
                preload
                fade
              ></plastic-image>

              <div class="description">
                <text-truncate lines="1">
                  <h3 class="name">[[speaker.name]]</h3>
                </text-truncate>
                <text-truncate lines="1">
                  <div class="origin">[[speaker.country]]</div>
                </text-truncate>
              </div>
            </div>
          </template>
        </div>

        <a href="{$ speakersBlock.callToAction.link $}">
          <paper-button class="cta-button animated icon-right">
            <span>{$ speakersBlock.callToAction.label $}</span>
            <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
          </paper-button>
        </a>
      </div>
    `;
  }

  static get is() {
    return 'speakers-block';
  }

  static get observers() {
    return ['_generateSpeakers(speakers)'];
  }

  static get properties() {
    return {
      featuredSpeakers: Array,
    };
  }

  stateChanged(state: State) {
    super.stateChanged(state);
    return this.setProperties({
      speakers: state.speakers.list,
    });
  }

  _openSpeaker(e) {
    window.history.pushState({}, null, '/speakers/');
    window.history.pushState({}, null, `/speakers/${e.model.speaker.id}/`);
    window.dispatchEvent(new CustomEvent('location-changed'));
  }

  _generateSpeakers(speakers) {
    const filteredSpeakers = this.speakers.filter((speaker) => speaker.featured);
    const randomSpeakers = randomOrder(filteredSpeakers.length ? filteredSpeakers : speakers);
    this.set('featuredSpeakers', randomSpeakers.slice(0, 4));
  }
}

window.customElements.define(SpeakersBlock.is, SpeakersBlock);
