import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { primitive } from '../../styles/shared';

/**
 * An on and off switch on a native checkbox with `role="switch"`. The content is its label, or
 * `label` when it has no visible one. Fires `change` when it is switched.
 */
@customElement('hb-switch')
export class HbSwitch extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override styles = [
    primitive,
    css`
      :host {
        display: inline-flex;
        vertical-align: middle;
      }

      label {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: var(--hb-space-3);
        min-block-size: var(--hb-target-min);
        cursor: pointer;
      }

      input {
        position: absolute;
        inset: 0;
        margin: 0;
        opacity: 0;
        cursor: inherit;
      }

      .track {
        display: inline-flex;
        align-items: center;
        flex: none;
        inline-size: 52px;
        block-size: 32px;
        padding: 4px;
        border: var(--hb-border-width) solid var(--hb-color-outline);
        border-radius: var(--hb-radius-full);
        background-color: var(--hb-color-surface-container-high);
        transition: background-color var(--hb-duration-short) var(--hb-ease-standard);
      }

      .thumb {
        inline-size: 20px;
        block-size: 20px;
        border-radius: 50%;
        background-color: var(--hb-color-on-surface-variant);
        transition: translate var(--hb-duration-medium) var(--hb-ease-spring);
      }

      input:checked + .track {
        border-color: var(--hb-color-primary);
        background-color: var(--hb-color-primary);
      }

      input:checked + .track .thumb {
        background-color: var(--hb-color-on-primary);
        translate: 20px 0;
      }

      input:focus-visible + .track {
        outline: 3px solid var(--hb-color-focus);
        outline-offset: 2px;
      }

      input:disabled + .track {
        opacity: 0.38;
      }

      input:disabled {
        cursor: default;
      }

      @media (forced-colors: active) {
        .track {
          border-color: CanvasText;
        }

        .thumb {
          background-color: CanvasText;
        }

        input:checked + .track {
          background-color: Highlight;
        }
      }
    `,
  ];

  @property({ type: Boolean, reflect: true })
  accessor checked = false;

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  /** The accessible name, when the switch has no visible label. */
  @property()
  accessor label: string | undefined;

  override render() {
    return html`
      <label>
        <input
          type="checkbox"
          role="switch"
          aria-label="${ifDefined(this.label)}"
          ?checked="${this.checked}"
          .checked="${live(this.checked)}"
          ?disabled="${this.disabled}"
          @change="${this.onChange}"
        />
        <span class="track" aria-hidden="true"><span class="thumb"></span></span>
        <slot></slot>
      </label>
    `;
  }

  // `change` does not leave the shadow root, so the switch fires its own.
  private onChange = (event: Event) => {
    this.checked = (event.target as HTMLInputElement).checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-switch': HbSwitch;
  }
}
