import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ClickOutsideController } from '../../controllers/click-outside-controller';
import { primitive } from '../../styles/shared';

/**
 * A panel that opens under its trigger, the element in the `trigger` slot, and holds any content.
 * It lines up with the trigger's end, and moves over to stay inside the viewport.
 * Clicking the trigger toggles it, and Escape or a click outside closes it.
 */
@customElement('hb-popover')
export class HbPopover extends LitElement {
  static override styles = [
    primitive,
    css`
      :host {
        position: relative;
        display: inline-flex;
      }

      .panel {
        display: none;
        position: absolute;
        z-index: 10;
        inset-block-start: calc(100% + var(--hb-space-2));
        inset-inline-end: 0;
        inline-size: max-content;
        max-inline-size: min(320px, 100vw - 2 * var(--hb-space-4));
        padding: var(--hb-space-5);
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-m);
        background-color: var(--hb-panel-background);
        backdrop-filter: var(--hb-backdrop-filter);
        color: var(--hb-color-on-surface);
        box-shadow: var(--hb-shadow-card);
      }

      :host([open]) .panel {
        display: block;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  accessor open = false;

  @query('.panel')
  private accessor panel!: HTMLElement;

  private readonly clickOutside = new ClickOutsideController(this, () => this.close());

  constructor() {
    super();
    this.addEventListener('keydown', this.onKeydown);
  }

  private get trigger() {
    return this.querySelector<HTMLElement & { expanded?: boolean }>(':scope > [slot="trigger"]');
  }

  show() {
    this.open = true;
  }

  close({ focusTrigger = false } = {}) {
    this.open = false;
    if (focusTrigger) this.trigger?.focus();
  }

  toggle() {
    this.open = !this.open;
  }

  override render() {
    return html`
      <slot
        name="trigger"
        @click="${() => this.toggle()}"
        @slotchange="${this.updateTrigger}"
      ></slot>
      <div class="panel"><slot></slot></div>
    `;
  }

  protected override updated(changed: PropertyValues<this>) {
    if (!changed.has('open')) return;
    this.updateTrigger();
    if (this.open) {
      this.fitViewport();
      this.clickOutside.start();
    } else {
      this.clickOutside.stop();
    }
  }

  private fitViewport() {
    const { panel } = this;
    panel.style.translate = '';
    const margin = 16;
    const { left, right } = panel.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    const shift =
      left < margin ? margin - left : right > viewport - margin ? viewport - margin - right : 0;
    if (shift) panel.style.translate = `${shift}px`;
  }

  private readonly updateTrigger = () => {
    const trigger = this.trigger;
    if (!trigger) return;
    if ('expanded' in trigger) {
      trigger.expanded = this.open;
    } else {
      trigger.setAttribute('aria-expanded', String(this.open));
    }
  };

  private readonly onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.open) return;
    event.preventDefault();
    this.close({ focusTrigger: true });
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-popover': HbPopover;
  }
}
