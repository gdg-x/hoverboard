import { customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import '../components/markdown/short-markdown';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { initialUiState } from '../store/ui/state';
import { aboutOrganizerBlock } from '../utils/data';
import '../utils/icons';
import './shared-styles';

@customElement('about-organizer-block')
export class AboutOrganizerBlock extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          display: block;
        }

        .block:not(:last-of-type) {
          margin-bottom: 32px;
        }

        .team-icon {
          --iron-icon-height: 160px;
          --iron-icon-width: 160px;
          --iron-icon-fill-color: var(--default-primary-color);
          max-width: 50%;
        }

        .image-link {
          width: 80%;
          height: 80%;
        }

        .organizers-photo {
          --lazy-image-width: 100%;
          --lazy-image-height: 100%;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
        }

        .description {
          color: var(--secondary-text-color);
        }

        paper-button {
          margin: 0;
        }
      </style>

      <div class="container" layout horizontal>
        <div layout horizontal center-center flex hidden$="[[viewport.isPhone]]">
          <a href="/team" class="image-link">
            <lazy-image
              class="organizers-photo"
              src="[[aboutOrganizerBlock.image]]"
              alt="Organizer"
            ></lazy-image>
          </a>
        </div>

        <div class="description-block" flex>
          <template is="dom-repeat" items="[[aboutOrganizerBlock.blocks]]" as="block">
            <div class="block">
              <h2>[[block.title]]</h2>

              <short-markdown class="description" content="[[block.description]]"></short-markdown>

              <template is="dom-if" if="[[block.callToAction.newTab]]">
                <a href="[[block.callToAction.link]]" target="_blank" rel="noopener noreferrer">
                  <paper-button class="cta-button animated icon-right">
                    <span>[[block.callToAction.label]]</span>
                    <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
                  </paper-button>
                </a>
              </template>
              <template is="dom-if" if="[[!block.callToAction.newTab]]">
                <a href="[[block.callToAction.link]]">
                  <paper-button class="cta-button animated icon-right">
                    <span>[[block.callToAction.label]]</span>
                    <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
                  </paper-button>
                </a>
              </template>
            </div>
          </template>
        </div>
      </div>
    `;
  }

  private aboutOrganizerBlock = aboutOrganizerBlock;

  @property({ type: Object })
  private viewport = initialUiState.viewport;

  override stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
  }
}
