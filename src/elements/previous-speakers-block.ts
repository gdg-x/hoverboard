import { customElement, observe, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState, store } from '../store';
import { fetchPreviousSpeakersList } from '../store/previous-speakers/actions';
import { randomOrder } from '../utils/functions';
import './shared-styles';

@customElement('previous-speakers-block')
export class PreviousSpeakersBlock extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          margin: 32px auto;
          display: block;
          text-align: center;
        }

        .speakers-wrapper {
          margin: 40px -8px 32px;
          position: relative;
          display: flex;
          flex-wrap: wrap;
          overflow: hidden;
          justify-content: center;
        }

        .speaker {
          margin: 8px;
        }

        .photo {
          width: 64px;
          height: 64px;
          background-color: var(--contrast-additional-background-color);
          border-radius: 50%;
          overflow: hidden;
          transform: translateZ(0);
        }

        @media (min-width: 640px) {
          .speakers-wrapper {
            margin-right: -12px;
            margin-left: -12px;
          }

          .speaker {
            margin: 12px;
          }

          .photo {
            width: 96px;
            height: 96px;
          }
        }
      </style>

      <div class="container">
        <h1 class="container-title">{$ previousSpeakersBlock.title $}</h1>

        <div class="speakers-wrapper">
          <template is="dom-repeat" items="[[speakers]]" as="speaker">
            <a
              class="speaker"
              href$="/previous-speakers/[[speaker.id]]"
              ga-on="click"
              ga-event-category="previous speaker"
              ga-event-action="open details"
              ga-event-label$="[[speaker.name]]"
            >
              <plastic-image
                class="photo"
                srcset="[[speaker.photoUrl]]"
                sizing="cover"
                lazy-load
                preload
                fade
              ></plastic-image>
            </a>
          </template>
        </div>

        <a href="{$ previousSpeakersBlock.callToAction.link $}">
          <paper-button class="animated icon-right">
            <span>{$ previousSpeakersBlock.callToAction.label $}</span>
            <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
          </paper-button>
        </a>
      </div>
    `;
  }

  @property({ type: Array })
  private speakerRow = [];
  @property({ type: Array })
  private speakers = [];
  @property({ type: Array })
  private speakersRaw = [];
  @property({ type: Boolean })
  private speakersFetching = false;
  @property({ type: Object })
  private speakersFetchingError = {};
  @property({ type: Object })
  private viewport: { isPhone?: boolean } = {};

  stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
    this.speakersRaw = state.previousSpeakers.list;
    this.speakersFetching = state.previousSpeakers.fetching;
    this.speakersFetchingError = state.previousSpeakers.fetchingError;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.speakersFetching && (!this.speakers || !this.speakers.length)) {
      store.dispatch(fetchPreviousSpeakersList());
    }
  }

  @observe('speakersRaw')
  _generateSpeakers(speakersRaw) {
    this.speakers = randomOrder(speakersRaw).slice(0, this.viewport.isPhone ? 8 : 14);
  }
}
