import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { title } from '../../config/site';
import { scrollToTop } from '../../utils/scrolling';
import { ThemedComponent } from '../themed-component';
import './color-scheme-toggle';
import './footer-nav';
import './footer-rel';
import './footer-social';
import './locale-picker';
import '../shared/hoverboard-icon';
import '../ui/hb-icon-button';
import '../ui/hb-sticker';

const HOVERBOARD_URL = 'https://github.com/gdg-x/hoverboard';

/** A full-width band with the event name, links, settings and the organizer. */
@customElement('footer-block')
export class FooterBlock extends ThemedComponent {
  static override styles = css`
    :host {
      margin-block-start: var(--hb-space-8);
    }

    footer {
      padding: var(--hb-space-8) var(--hb-gutter) var(--hb-space-6);
      background-color: var(--hb-footer-background);
      color: var(--hb-footer-text);
    }

    .inner {
      display: grid;
      gap: var(--hb-space-7);
      max-inline-size: var(--hb-content-max);
      margin-inline: auto;
    }

    .top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--hb-space-4);
    }

    .event-name {
      margin: 0;
      font: 800 var(--hb-text-4xl) / 1.05 var(--hb-font-display);
      overflow-wrap: anywhere;
    }

    .columns {
      display: grid;
      gap: var(--hb-space-7);
      grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    }

    .connect {
      display: grid;
      align-content: start;
      gap: var(--hb-space-4);
    }

    a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }

    .settings {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--hb-space-4) var(--hb-space-6);
      padding-block-start: var(--hb-space-5);
      border-block-start: 1px solid currentColor;
    }

    .fork-me {
      justify-self: start;
      text-decoration: none;
    }
  `;

  override render() {
    return html`
      <footer>
        <div class="inner">
          <div class="top">
            <p class="event-name">${title}</p>
            <hb-icon-button
              class="back-to-top"
              variant="tonal"
              label="${msg('Back to top', { id: 'footer.block.back-to-top' })}"
              @click="${scrollToTop}"
            >
              <hoverboard-icon name="up"></hoverboard-icon>
            </hb-icon-button>
          </div>

          <div class="columns">
            <footer-rel></footer-rel>
            <div class="connect">
              <footer-social></footer-social>
              ${
                __HB_FEATURES__.subscribe
                  ? html`<a class="subscribe" href="/#subscribe">
                      ${msg('Get updates by email', { id: 'footer.block.subscribe' })}
                    </a>`
                  : nothing
              }
            </div>
          </div>

          <div class="settings">
            <locale-picker></locale-picker>
            <color-scheme-toggle></color-scheme-toggle>
          </div>

          <footer-nav></footer-nav>

          ${
            __HB_FEATURES__.forkMe
              ? html`<a
                  class="fork-me"
                  href="${HOVERBOARD_URL}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <hb-sticker tilt="-4"
                    >${msg('Fork me on GitHub', { id: 'footer.block.fork-me' })}</hb-sticker
                  >
                </a>`
              : nothing
          }
        </div>
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'footer-block': FooterBlock;
  }
}
