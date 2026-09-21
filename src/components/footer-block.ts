import '@material/web/fab/fab.js';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { scrollToTop } from '../utils/scrolling';
import { ThemedElement } from './themed-element';
import './footer-nav';
import './footer-rel';
import './footer-social';
import './hoverboard-icon';

@customElement('footer-block')
export class FooterBlock extends ThemedElement {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          margin-top: 40px;
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

        .fab md-fab {
          --md-fab-container-color: var(--primary-background-color);
          --md-fab-container-shape: 50%;
          --md-fab-icon-color: var(--footer-text-color);
          pointer-events: all;
          box-shadow:
            0 0 8px 0 rgba(0, 0, 0, 0.12),
            0 8px 8px 0 rgba(0, 0, 0, 0.24);
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
      `,
    ];
  }

  override render() {
    return html`
      <div class="container">
        <div class="fab">
          <md-fab class="back-to-top" aria-label="Back to top" @click="${scrollToTop}">
            <hoverboard-icon slot="icon" name="up"></hoverboard-icon>
          </md-fab>
        </div>
        <footer-social layout flex flex-auto horizontal wrap></footer-social>
        <footer-rel></footer-rel>
        <footer-nav layout horizontal wrap justified center></footer-nav>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'footer-block': FooterBlock;
  }
}
