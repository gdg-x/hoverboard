import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { primitive } from '../../styles/shared';

/**
 * A rotated label for status and fun, such as "Sold out" or "Live now". It always has text, so it
 * never carries meaning by color or shape alone. With `theme.decorations` off it is not rotated.
 */
@customElement('hb-sticker')
export class HbSticker extends LitElement {
  static override styles = [
    primitive,
    css`
      :host {
        display: inline-block;
      }

      .sticker {
        --hb-sticker-rotate: calc(var(--hb-sticker-tilt) * var(--hb-decorations, 1));

        display: inline-block;
        padding: var(--hb-space-1) var(--hb-space-3);
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-full);
        background-color: var(--hb-color-accent-3-container);
        color: var(--hb-color-on-accent-3-container);
        box-shadow: var(--hb-shadow-button);
        font: 700 var(--hb-text-xs) / 1.4 var(--hb-font-display);
        letter-spacing: 0.02em;
        rotate: var(--hb-sticker-rotate);
      }

      .sticker:hover {
        animation: wiggle 400ms var(--hb-ease-spring);
      }

      @keyframes wiggle {
        50% {
          rotate: calc(var(--hb-sticker-rotate) * -1);
        }
      }

      :host([accent='1']) .sticker {
        background-color: var(--hb-color-accent-1-container);
        color: var(--hb-color-on-accent-1-container);
      }

      :host([accent='2']) .sticker {
        background-color: var(--hb-color-accent-2-container);
        color: var(--hb-color-on-accent-2-container);
      }

      :host([accent='4']) .sticker {
        background-color: var(--hb-color-accent-4-container);
        color: var(--hb-color-on-accent-4-container);
      }

      @media (forced-colors: active) {
        .sticker {
          border-color: CanvasText;
        }
      }
    `,
  ];

  /** Rotation in degrees. */
  @property({ type: Number })
  accessor tilt = -3;

  @property({ reflect: true })
  accessor accent: '1' | '2' | '3' | '4' = '3';

  override render() {
    return html`<span
      class="sticker"
      style="${styleMap({ '--hb-sticker-tilt': `${this.tilt}deg` })}"
      ><slot></slot
    ></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-sticker': HbSticker;
  }
}
