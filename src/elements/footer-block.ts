import { customElement } from '@polymer/decorators';
import '@polymer/paper-fab';
import { html, PolymerElement } from '@polymer/polymer';
import '../utils/icons';
import { scrollToTop } from '../utils/scrolling';
import './footer-nav';
import './footer-rel';
import './footer-social';

@customElement('footer-block')
export class FooterBlock extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          margin-top: 40px;
          display: block;
          position: relative;
          color: var(--footer-text-color);
          background: var(--footer-background-color);
          font-size: 14px;
          line-height: 1.5;
        }

        .container {
          margin: 0 auto;
          padding: 20px 0;
          position: relative;
        }

        .fab paper-fab {
          background: var(--primary-background-color);
          color: inherit;
          pointer-events: all;
          box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.12), 0 8px 8px 0 rgba(0, 0, 0, 0.24);
        }

        .fab {
          position: absolute;
          right: 25px;
          top: -25px;
          pointer-events: none;
          z-index: 1;
        }

        @media (min-width: 640px) {
          .container {
            padding: 15px 36px;
          }
        }
      </style>

      <div class="container">
        <div class="fab">
          <paper-fab class="back-to-top" icon="hoverboard:up" on-click="backToTop"></paper-fab>
        </div>
        <footer-social layout flex flex-auto horizontal wrap></footer-social>
        <footer-rel></footer-rel>
        <footer-nav layout horizontal wrap justified center></footer-nav>
      </div>
    `;
  }

  backToTop() {
    scrollToTop();
  }
}
