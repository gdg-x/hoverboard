import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { primitive, stateLayer } from '../../styles/shared';
import { safeUrl } from '../../utils/safe-url';

/**
 * A small pill: a label, a link with `href`, or a filter button with `filter` that shows
 * `selected` with a check mark, not only a color.
 *
 * `accent` (1 to 4) picks a theme accent. Other colors, such as tag colors, are set with
 * `--hb-chip-background`, `--hb-chip-color` and `--hb-chip-border-color`.
 */
@customElement('hb-chip')
export class HbChip extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override styles = [
    primitive,
    stateLayer,
    css`
      :host {
        --hb-chip-background: transparent;
        --hb-chip-color: currentColor;
        --hb-chip-border-color: var(--hb-color-outline);

        display: inline-flex;
        vertical-align: middle;
      }

      :host([accent='1']) {
        --hb-chip-background: var(--hb-color-accent-1-container);
        --hb-chip-color: var(--hb-color-on-accent-1-container);
        --hb-chip-border-color: transparent;
      }

      :host([accent='2']) {
        --hb-chip-background: var(--hb-color-accent-2-container);
        --hb-chip-color: var(--hb-color-on-accent-2-container);
        --hb-chip-border-color: transparent;
      }

      :host([accent='3']) {
        --hb-chip-background: var(--hb-color-accent-3-container);
        --hb-chip-color: var(--hb-color-on-accent-3-container);
        --hb-chip-border-color: transparent;
      }

      :host([accent='4']) {
        --hb-chip-background: var(--hb-color-accent-4-container);
        --hb-chip-color: var(--hb-color-on-accent-4-container);
        --hb-chip-border-color: transparent;
      }

      .chip {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: var(--hb-space-1);
        min-block-size: 32px;
        margin: 0;
        padding: var(--hb-space-1) var(--hb-space-3);
        border: 1.5px solid var(--hb-chip-border-color);
        border-radius: var(--hb-radius-full);
        background-color: var(--hb-chip-background);
        color: var(--hb-chip-color);
        font: 500 var(--hb-text-sm) / 1.2 var(--hb-font-mono);
        text-decoration: none;
      }

      a.chip,
      button.chip {
        cursor: pointer;
      }

      /* Looks 32px tall, but takes taps 44px tall. */
      a.chip::after,
      button.chip::after {
        content: '';
        position: absolute;
        inset: -6px 0;
      }

      button.chip[aria-pressed='true'] {
        border-color: var(--hb-color-primary);
        background-color: var(--hb-color-primary);
        color: var(--hb-color-on-primary);
      }

      button.chip[aria-pressed='true']::before {
        content: '✓';
      }

      ::slotted([slot='icon']) {
        inline-size: 18px;
        block-size: 18px;
      }

      @media (forced-colors: active) {
        .chip {
          border-color: CanvasText;
        }

        button.chip[aria-pressed='true'] {
          border-color: Highlight;
          background-color: Highlight;
          color: HighlightText;
        }
      }
    `,
  ];

  /** Makes the chip a link. */
  @property()
  accessor href: string | undefined;

  /** Makes the chip a toggle button. */
  @property({ type: Boolean, reflect: true })
  accessor filter = false;

  @property({ type: Boolean, reflect: true })
  accessor selected = false;

  @property({ reflect: true })
  accessor accent: '1' | '2' | '3' | '4' | undefined;

  override render() {
    const content = html`<slot name="icon"></slot><slot></slot>`;
    const href = safeUrl(this.href);
    if (href !== undefined) {
      return html`<a class="chip state" href="${href}">${content}</a>`;
    }
    if (this.filter) {
      return html`
        <button class="chip state" type="button" aria-pressed="${String(this.selected)}">
          ${content}
        </button>
      `;
    }
    return html`<span class="chip">${content}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-chip': HbChip;
  }
}
