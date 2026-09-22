import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

/**
 * A modal dialog built on the native `<dialog>` element
 * (https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog).
 *
 * Provides `headline`, `content`, and `actions` slots, opens/closes via the
 * `open` property, dispatches a non-bubbling `closed` event when the dialog
 * is dismissed (close button, Escape key, or backdrop click), and relies on
 * the native element for backdrop rendering, Escape-to-dismiss, and focus
 * trapping/restoration.
 */
@customElement('hoverboard-dialog')
export class HoverboardDialog extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    dialog {
      border: none;
      border-radius: 12px;
      box-shadow: var(--box-shadow, 0 2px 8px rgb(0 0 0 / 30%));
      background: var(--primary-background-color, #fff);
      color: var(--primary-text-color, #424242);
      padding: 0;
      margin: auto;
      width: var(--hoverboard-dialog-width, fit-content);
      min-width: var(--hoverboard-dialog-min-width, 280px);
      max-width: var(--hoverboard-dialog-max-width, min(560px, calc(100% - 48px)));
      max-height: var(--hoverboard-dialog-max-height, min(80vh, calc(100% - 48px)));
    }

    dialog::backdrop {
      background: rgb(0 0 0 / 32%);
    }

    dialog:not([open]) {
      display: none;
    }

    .headline {
      font-size: 1.25rem;
      font-weight: 500;
      line-height: 2rem;
      padding: 24px 24px 0;
    }

    .headline:empty {
      display: none;
    }

    .content {
      padding: 24px;
      overflow-y: auto;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 24px 24px;
    }

    .actions:empty {
      display: none;
    }
  `;

  /** Whether the dialog is open. Setting this calls showModal()/close(). */
  @property({ type: Boolean, reflect: true })
  open = false;

  @query('dialog')
  private nativeDialog!: HTMLDialogElement;

  override firstUpdated() {
    this.nativeDialog.addEventListener('close', () => this.onNativeClose());
    this.nativeDialog.addEventListener('click', (event) => this.onDialogClick(event));
  }

  override updated(changedProperties: PropertyValues<this>) {
    if (changedProperties.has('open')) {
      if (this.open && !this.nativeDialog.open) {
        this.nativeDialog.showModal();
      } else if (!this.open && this.nativeDialog.open) {
        this.nativeDialog.close();
      }
    }
  }

  override render() {
    return html`
      <dialog>
        <div class="headline"><slot name="headline"></slot></div>
        <div class="content"><slot name="content"></slot></div>
        <div class="actions"><slot name="actions"></slot></div>
      </dialog>
    `;
  }

  /** Closes the dialog, mirroring the native HTMLDialogElement API. */
  close() {
    this.nativeDialog.close();
  }

  private onNativeClose() {
    this.open = false;
    this.dispatchEvent(new Event('closed'));
  }

  // Dismiss when the click lands outside of the dialog's content box, i.e.
  // on the ::backdrop. See the "Allow closing the dialog by clicking
  // outside of it" recipe in MDN's <dialog> documentation.
  private onDialogClick(event: MouseEvent) {
    const rect = this.nativeDialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      this.close();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hoverboard-dialog': HoverboardDialog;
  }
}
