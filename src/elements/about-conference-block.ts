import {customElement, property} from '@polymer/decorators'
import '@polymer/iron-icon'
import '@polymer/paper-button'
import {html, PolymerElement} from '@polymer/polymer'
import '@power-elements/lazy-image'
import '../components/markdown/short-markdown'
import {RootState} from '../store'
import {ReduxMixin} from '../store/mixin'
import {initialUiState} from '../store/ui/state'
import {callToSchedule} from '../utils/data'
import '../utils/icons'
import './shared-styles'

@customElement('about-conference-block')
export class AboutConferenceBlock extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          display: block;
          background: var(--tertiary-background-color);
          padding: 16px 0;
        }

        .container {
          padding-top: 64px;
          display: grid;
          grid-gap: 61px;
          grid-template-columns: 1fr;
        }

        .categories-container {
          width: 100%;
          display: grid;
          grid-gap: 12px 12px;
          grid-template-columns: repeat(2, 1fr);
        }

        .label {
          margin-top: 4px;
        }

        .icons {
          width: 20px;
          min-height: 20px;
          margin-right: 10px;
          top: 4px;
          display: inline-flex;
        }

        @media (min-width: 640px) {
          .content {
            grid-gap: 64px;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          }

          .categories-container {
            grid-gap: 12px;
          }
        }
      </style>

      <div class="container" layout horizontal>
        <div>
          <h1 class="container-title">[[ callToSchedule.title]]</h1>
          <p>[[ callToSchedule.description]] <b>[[ callToSchedule.description2]]</b></p>
          <p>[[ callToSchedule.description3]]</p>
          <a
            href="[[ callToSchedule.url]]"
            target="_blank"
          >
            <paper-button class="cta-button animated icon-right">
              <span>[[ callToSchedule.action]]</span>
              <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
            </paper-button>
          </a>
        </div>
        <div class="categories-container">

          <template is="dom-repeat" items="[[callToSchedule.categories]]" as="cat">
            <div class="item" layout left>
              <lazy-image class="icons" src="[[ cat.icon ]]" sizing="contain"
                          alt="Sunny Tech Montpellier"></lazy-image>
              <span>[[ cat.title ]]</span></div>
          </template>
        </div>
      </div>
    `
  }

  private callToSchedule = callToSchedule

  @property({type: Object})
  private viewport = initialUiState.viewport

  override stateChanged(state: RootState) {
    this.viewport = state.ui.viewport
  }
}
