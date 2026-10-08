import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { primitive } from '../../styles/shared';

/**
 * A short message at the bottom of the screen. The content is the message, and a button can go in
 * the `action` slot. It sits in a status region, so screen readers announce it when it opens.
 */
@customElement('hb-toast')
export class HbToast extends LitElement {
  static override styles = [
    primitive,
    css`
      :host {
        display: contents;
      }

      .toast {
        position: fixed;
        inset: auto auto var(--hb-space-5) 50%;
        translate: -50% 0;
        display: flex;
        align-items: center;
        gap: var(--hb-space-4);
        inline-size: max-content;
        max-inline-size: min(560px, 100vw - 2 * var(--hb-space-4));
        margin: 0;
        padding: var(--hb-space-3) var(--hb-space-3) var(--hb-space-3) var(--hb-space-5);
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-m);
        background-color: var(--hb-color-ink);
        color: var(--hb-color-surface);
        box-shadow: var(--hb-shadow-card);
      }

      .message {
        flex: 1;
      }

      ::slotted([slot='action']) {
        --hb-button-color: var(--hb-color-surface);

        flex: none;
      }

      @media (forced-colors: active) {
        .toast {
          border-color: CanvasText;
        }
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  accessor open = false;

  @query('.toast')
  private accessor toast!: HTMLElement;

  override render() {
    return html`
      <div role="status">
        <div class="toast" popover="manual">
          <span class="message"><slot></slot></span>
          <slot name="action"></slot>
        </div>
      </div>
    `;
  }

  protected override updated(changed: PropertyValues<this>) {
    if (!changed.has('open')) return;
    if (this.open) {
      this.toast.showPopover();
    } else if (changed.get('open')) {
      this.toast.hidePopover();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-toast': HbToast;
  }
}
