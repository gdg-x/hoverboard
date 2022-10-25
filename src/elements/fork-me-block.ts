import { customElement } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import '../utils/icons';
import './shared-styles';

@customElement('fork-me-block')
export class ForkMeBlock extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: flex;
          width: 100%;
          background: var(--accent-color);
          color: var(--text-secondary-color);
          padding: 16px 0;
        }

        paper-button {
          color: #000;
        }
      </style>

      <div class="container container-narrow">
        <h1 class="container-title">Fork me on GitHub</h1>
        <p>
          Hoverboard is open source conference website template and is developed entirely on a
          voluntary basis. You can check the source code that generated this website on Github. If
          you find a issue or you want to contribute, you're more than welcome!
        </p>
        <a href="https://github.com/gdg-x/hoverboard">
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
}
