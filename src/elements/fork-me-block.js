import '@polymer/iron-icon';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin.js';
import { dialogsActions, subscribeActions } from '../redux/actions.js';
import { DIALOGS } from '../redux/constants.js';
import './hoverboard-icons.js';
import './shared-styles.js';

class ForkMeBlock extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
    <style include="shared-styles flex flex-alignment">      

      :host {
        display: flex;
        width: 100%;
        background: var(--accent-color);
        color: var(--text-primary-color);
        padding: 16px 0;
      }

      paper-button {
        color: #fff;
      }

    </style>

    <div class="container container-narrow">
      <h1 class="container-title">Fork me on GitHub</h1>
      <p>
        Hoverboard is open source and is developed entirely on a voluntary basis.<br/>
        You can check the source code that generated this website on Github.<br/>
        If you find a issue or you want to contribute, you're more than welcome!<br/>
      </p>
      <a href="https://github.com/gdg-x/hoverboard/fork">
        <div class="cta-button">
          <paper-button class="icon-right">
            <span class="cta-label">Fork this project</span>
            <iron-icon icon="hoverboard:github"></iron-icon>
          </paper-button>
        </div>
      </a>
    </div>
`;
  }

  static get is() {
    return 'fork-me-block';
  }
}

window.customElements.define(ForkMeBlock.is, ForkMeBlock);
