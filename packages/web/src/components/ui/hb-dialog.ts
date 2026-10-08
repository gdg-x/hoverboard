import { msg, updateWhenLocaleChanges } from '@lit/localize';
import { css, html, LitElement, type PropertyValues, svg } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { primitive } from '../../styles/shared';
import './hb-icon-button';

const closeIcon = svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

/**
 * A modal dialog on the native `<dialog>`: the browser traps focus, makes the page inert and closes
 * it with Escape. `heading` names it. Buttons go in the `actions` slot.
 *
 * Fires `close` when it closes, from a button, Escape or a click outside.
 */
@customElement('hb-dialog')
export class HbDialog extends LitElement {
  static override styles = [
    primitive,
    css`
      :host {
        display: contents;
      }

      dialog {
        inline-size: min(var(--hb-dialog-width, 560px), 100% - 2 * var(--hb-space-4));
        max-block-size: min(720px, 100% - 2 * var(--hb-space-4));
        padding: 0;
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-l);
        background-color: var(--hb-color-surface-bright);
        color: var(--hb-color-on-surface);
        box-shadow: var(--hb-shadow-card);
      }

      dialog::backdrop {
        background-color: var(--hb-color-scrim);
      }

      .panel {
        display: flex;
        flex-direction: column;
        gap: var(--hb-space-4);
        padding: var(--hb-space-5);
      }

      header {
        display: flex;
        align-items: flex-start;
        gap: var(--hb-space-2);
      }

      h2 {
        flex: 1;
        margin: 0;
        padding-block-start: var(--hb-space-2);
        font: 700 var(--hb-text-xl) / 1.2 var(--hb-font-display);
        overflow-wrap: anywhere;
      }

      hb-icon-button {
        margin: calc(var(--hb-space-2) * -1);
      }

      svg {
        inline-size: 24px;
        block-size: 24px;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--hb-space-2);
      }

      /* A bottom sheet on narrow screens. */
      @media (max-width: 599px) {
        dialog {
          inline-size: 100%;
          max-inline-size: 100%;
          margin-block-end: 0;
          border-end-start-radius: 0;
          border-end-end-radius: 0;
        }
      }

      :host([fullscreen]) dialog {
        inline-size: 100%;
        max-inline-size: 100%;
        block-size: 100%;
        max-block-size: 100%;
        margin: 0;
        border: 0;
        border-radius: 0;
        box-shadow: none;
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  accessor open = false;

  /** Covers the whole screen, as the navigation sheet does. */
  @property({ type: Boolean, reflect: true })
  accessor fullscreen = false;

  @property()
  accessor heading = '';

  @query('dialog')
  private accessor dialog!: HTMLDialogElement;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  /** Closes the dialog, as the close button does. */
  close() {
    this.open = false;
  }

  override render() {
    return html`
      <dialog aria-labelledby="heading" @close="${this.onClose}" @click="${this.onClick}">
        <div class="panel">
          <header>
            <h2 id="heading">${this.heading}</h2>
            <hb-icon-button
              label="${msg('Close', { id: 'common.close' })}"
              @click="${() => this.close()}"
              >${closeIcon}</hb-icon-button
            >
          </header>
          <slot></slot>
          <div class="actions"><slot name="actions"></slot></div>
        </div>
      </dialog>
    `;
  }

  protected override updated(changed: PropertyValues<this>) {
    if (!changed.has('open')) return;
    if (this.open && !this.dialog.open) {
      this.dialog.showModal();
    } else if (!this.open && this.dialog.open) {
      this.dialog.close();
    }
  }

  private onClose = () => {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };

  // The dialog itself is only hit outside the panel, on the backdrop.
  private onClick = (event: MouseEvent) => {
    if (event.target === this.dialog) {
      this.close();
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-dialog': HbDialog;
  }
}
