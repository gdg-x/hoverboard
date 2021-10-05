import { customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/marked-element';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState } from '../store';
import { Viewport } from '../store/ui/types';
import './hoverboard-icons';
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
          width: 100%;
          height: 100%;
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
          <a
            href="/team"
            class="image-link"
            ga-on="click"
            ga-event-category="link"
            ga-event-action="open"
            ga-event-label="open team page"
          >
            <plastic-image
              class="organizers-photo"
              srcset="{$ aboutOrganizerBlock.image $}"
              sizing="cover"
              lazy-load
              preload
              fade
            ></plastic-image>
          </a>
        </div>

        <div class="description-block" flex>
          <div class="block">
            <h2>{$ aboutOrganizerBlock.blocks[0].title $}</h2>

            <marked-element class="description" markdown="{$ aboutOrganizerBlock.blocks[0].description $}">
              <div slot="markdown-html"></div>
            </marked-element>
          </div>
          <div class="block">
            <h2>{$ aboutOrganizerBlock.blocks[1].title $}</h2>

            <marked-element class="description" markdown="{$ aboutOrganizerBlock.blocks[1].description $}">
              <div slot="markdown-html"></div>
            </marked-element>
              <a
                href="{$ aboutOrganizerBlock.blocks[1].callToAction.link $}"
                {%
                if
                aboutOrganizerBlock.blocks[1].calltoaction.newtab
                %}
                target="_blank"
                rel="noopener noreferrer"
                {%
                endif
                %}
              >
                <paper-button class="cta-button animated icon-right">
                  <span>{$ aboutOrganizerBlock.blocks[1].callToAction.label $}</span>
                  <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
                </paper-button>
              </a>
          </div>
        </div>
      </div>
    `;
  }

  @property({ type: Object })
  private viewport: Viewport;

  stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
  }
}
