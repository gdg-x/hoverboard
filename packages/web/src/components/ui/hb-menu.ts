import { css, html, LitElement, type PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { primitive } from '../../styles/shared';

/**
 * A menu that opens from its trigger, the element in the `trigger` slot. The items are the content:
 * links and buttons with `role="menuitem"`. Arrow keys move between items, and Escape, Tab, a
 * click on an item or a click outside close it.
 *
 * The menu is a manual popover, so it shows above everything, and is placed under the trigger.
 */
@customElement('hb-menu')
export class HbMenu extends LitElement {
  static override styles = [
    primitive,
    css`
      :host {
        display: inline-block;
      }

      .menu {
        position: absolute;
        inset: auto;
        min-inline-size: 200px;
        max-inline-size: min(360px, 100vw - 16px);
        margin: 0;
        padding: var(--hb-space-2) 0;
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-m);
        background-color: var(--hb-panel-background);
        backdrop-filter: var(--hb-backdrop-filter);
        color: var(--hb-color-on-surface);
        box-shadow: var(--hb-shadow-card);
      }

      ::slotted([role='menuitem']) {
        display: flex;
        align-items: center;
        gap: var(--hb-space-3);
        box-sizing: border-box;
        inline-size: 100%;
        min-block-size: var(--hb-target-min);
        margin: 0;
        padding: var(--hb-space-2) var(--hb-space-4);
        border: 0;
        background: transparent;
        color: inherit;
        font: 500 var(--hb-text-md) / 1.4 var(--hb-font-body);
        text-align: start;
        text-decoration: none;
        cursor: pointer;
      }

      ::slotted([role='menuitem']:hover),
      ::slotted([role='menuitem']:focus-visible) {
        background-color: color-mix(in srgb, currentColor 8%, transparent);
      }

      ::slotted([role='menuitem']:focus-visible) {
        outline: 3px solid var(--hb-color-focus);
        outline-offset: -3px;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  accessor open = false;

  @query('.menu')
  private accessor menu!: HTMLElement;

  private get trigger() {
    return this.querySelector<HTMLElement & { expanded?: boolean; haspopup?: string }>(
      ':scope > [slot="trigger"]',
    );
  }

  private get items() {
    return [...this.querySelectorAll<HTMLElement>(':scope > [role="menuitem"]')];
  }

  show() {
    if (this.open) return;
    this.menu.showPopover();
    this.open = true;
    this.place();
    document.addEventListener('pointerdown', this.onPointerDown, true);
    this.items[0]?.focus();
  }

  close({ focusTrigger = false } = {}) {
    if (!this.open) return;
    this.menu.hidePopover();
    this.open = false;
    document.removeEventListener('pointerdown', this.onPointerDown, true);
    if (focusTrigger) this.trigger?.focus();
  }

  toggle() {
    if (this.open) {
      this.close();
    } else {
      this.show();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.onPointerDown, true);
  }

  override render() {
    return html`
      <slot
        name="trigger"
        @click="${() => this.toggle()}"
        @slotchange="${this.updateTrigger}"
      ></slot>
      <div
        class="menu"
        popover="manual"
        role="menu"
        @keydown="${this.onKeydown}"
        @click="${this.onMenuClick}"
      >
        <slot></slot>
      </div>
    `;
  }

  protected override updated(changed: PropertyValues<this>) {
    if (changed.has('open')) this.updateTrigger();
  }

  private updateTrigger = () => {
    const trigger = this.trigger;
    if (!trigger) return;
    if ('expanded' in trigger) {
      trigger.expanded = this.open;
      trigger.haspopup = 'menu';
    } else {
      trigger.setAttribute('aria-expanded', String(this.open));
      trigger.setAttribute('aria-haspopup', 'menu');
    }
  };

  // Under the trigger, or over it when there is no room below. In the top layer, `absolute` is
  // relative to the page, so the menu scrolls with it.
  private place() {
    const trigger = this.trigger;
    if (!trigger) return;
    const anchor = trigger.getBoundingClientRect();
    const menu = this.menu.getBoundingClientRect();
    const gap = 4;
    const top =
      anchor.bottom + gap + menu.height <= window.innerHeight
        ? anchor.bottom + gap
        : Math.max(gap, anchor.top - gap - menu.height);
    const left = Math.max(gap, Math.min(anchor.left, window.innerWidth - menu.width - gap));
    this.menu.style.top = `${top + window.scrollY}px`;
    this.menu.style.left = `${left + window.scrollX}px`;
  }

  private onPointerDown = (event: PointerEvent) => {
    if (!event.composedPath().includes(this)) this.close();
  };

  private onMenuClick = (event: MouseEvent) => {
    const item = event
      .composedPath()
      .find(
        (target) => target instanceof HTMLElement && target.getAttribute('role') === 'menuitem',
      );
    if (item) this.close();
  };

  private onKeydown = (event: KeyboardEvent) => {
    const items = this.items;
    const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
    const index = items.findIndex((item) => item === active);
    const focus = (next: number) => items.at(next % items.length)?.focus();
    switch (event.key) {
      case 'ArrowDown':
        focus(index + 1);
        break;
      case 'ArrowUp':
        focus(index <= 0 ? -1 : index - 1);
        break;
      case 'Home':
        focus(0);
        break;
      case 'End':
        focus(-1);
        break;
      case 'Escape':
        this.close({ focusTrigger: true });
        break;
      case 'Tab':
        this.close();
        return;
      default:
        return;
    }
    event.preventDefault();
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-menu': HbMenu;
  }
}
