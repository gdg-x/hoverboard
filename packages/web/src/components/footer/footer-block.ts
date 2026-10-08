import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { scrollToTop } from '../../utils/scrolling';
import { ThemedElement } from '../themed-element';
import './footer-nav';
import './footer-rel';
import './footer-social';
import './locale-picker';
import '../shared/hoverboard-icon';
import '../ui/hb-icon-button';

@customElement('footer-block')
export class FooterBlock extends ThemedElement {
  static override styles = css`
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

    .footer-nav {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
    }

    .footer-social {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      flex: 1 1 auto;
    }

    .fab hb-icon-button {
      pointer-events: all;
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
  `;

  override render() {
    return html`
      <div class="container">
        <div class="fab">
          <hb-icon-button
            class="back-to-top"
            variant="tonal"
            size="l"
            label="${msg('Back to top', { id: 'footer.block.back-to-top' })}"
            @click="${scrollToTop}"
          >
            <hoverboard-icon name="up"></hoverboard-icon>
          </hb-icon-button>
        </div>
        <footer-social class="footer-social"></footer-social>
        <footer-rel></footer-rel>
        <footer-nav class="footer-nav"></footer-nav>
        <locale-picker></locale-picker>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'footer-block': FooterBlock;
  }
}
