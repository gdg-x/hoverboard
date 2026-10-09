import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { primitive } from '../../styles/shared';
import { safeUrl } from '../../utils/safe-url';

/**
 * A card. With `href`, a link named by `label` covers the whole card. Buttons and links in the
 * `actions` slot sit above it, so they stay clickable.
 */
@customElement('hb-card')
export class HbCard extends LitElement {
  static override styles = [
    primitive,
    css`
      :host {
        display: block;
      }

      .card {
        position: relative;
        block-size: 100%;
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-l);
        background-color: var(--hb-panel-background);
        backdrop-filter: var(--hb-backdrop-filter);
        color: var(--hb-color-on-surface);
        box-shadow: var(--hb-shadow-card);
        transition:
          translate var(--hb-duration-short) var(--hb-ease-spring),
          box-shadow var(--hb-duration-short) var(--hb-ease-standard);
      }

      .card.link:hover {
        translate: -2px -2px;
        box-shadow: var(--hb-shadow-card-hover);
      }

      .card.link:active {
        translate: var(--hb-press-offset) var(--hb-press-offset);
        box-shadow: none;
      }

      .cover {
        position: absolute;
        z-index: 1;
        inset: 0;
        border-radius: inherit;
      }

      .cover:focus-visible {
        outline: none;
      }

      .card:has(.cover:focus-visible) {
        outline: 3px solid var(--hb-color-focus);
        outline-offset: 2px;
      }

      ::slotted([slot='actions']) {
        position: relative;
        z-index: 2;
      }

      @media (forced-colors: active) {
        .card {
          border-color: CanvasText;
        }
      }
    `,
  ];

  @property()
  accessor href: string | undefined;

  /** The name of the card's link, such as the speaker's name. */
  @property()
  accessor label = '';

  override render() {
    const href = safeUrl(this.href);
    return html`
      <article class="card ${href === undefined ? '' : 'link'}">
        <slot></slot>
        ${
          href === undefined
            ? nothing
            : html`<a class="cover" href="${href}" aria-label="${this.label}"></a>`
        }
        <slot name="actions"></slot>
      </article>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-card': HbCard;
  }
}
