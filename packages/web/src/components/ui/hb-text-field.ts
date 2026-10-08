import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { primitive } from '../../styles/shared';

/**
 * A text field with a visible label, an optional hint, and an error that marks it invalid.
 * `type="textarea"` makes it multi-line. An icon can go in the `suffix` slot.
 *
 * `input` events come from the field as they would from an `<input>`, and `value` is up to date.
 */
@customElement('hb-text-field')
export class HbTextField extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override styles = [
    primitive,
    css`
      :host {
        display: block;
      }

      label {
        display: block;
        margin-block-end: var(--hb-space-1);
        font-weight: 600;
      }

      .control {
        display: flex;
        align-items: center;
        gap: var(--hb-space-2);
        min-block-size: var(--hb-target-min);
        padding-inline: var(--hb-space-3);
        border: var(--hb-border-width) solid var(--hb-color-outline);
        border-radius: var(--hb-radius-s);
        background-color: var(--hb-color-surface-bright);
        color: var(--hb-color-on-surface);
      }

      .control:focus-within {
        outline: 3px solid var(--hb-color-focus);
        outline-offset: 2px;
      }

      :host([error]:not([error=''])) .control {
        border-color: var(--hb-color-error);
      }

      :host([disabled]) .control {
        opacity: 0.6;
      }

      input,
      textarea {
        flex: 1;
        /* A percentage, so the field can be narrower than the input's default size. */
        inline-size: 100%;
        min-inline-size: 0;
        padding-block: var(--hb-space-2);
        border: 0;
        background: transparent;
        color: inherit;
        font: 400 var(--hb-text-md) / 1.5 var(--hb-font-body);
      }

      input:focus,
      textarea:focus {
        outline: none;
      }

      textarea {
        resize: vertical;
      }

      .hint,
      .error {
        margin: var(--hb-space-1) 0 0;
        font-size: var(--hb-text-sm);
      }

      .hint {
        color: var(--hb-color-on-surface-variant);
      }

      .error {
        color: var(--hb-color-error);
        font-weight: 600;
      }

      @media (forced-colors: active) {
        .control {
          border-color: CanvasText;
        }
      }
    `,
  ];

  @property()
  accessor label = '';

  @property()
  accessor value = '';

  /** An `<input>` type, or `textarea`. */
  @property()
  accessor type = 'text';

  @property()
  accessor name: string | undefined;

  @property()
  accessor autocomplete: string | undefined;

  @property({ type: Number })
  accessor maxlength: number | undefined;

  @property({ type: Number })
  accessor rows = 3;

  @property({ type: Boolean, reflect: true })
  accessor required = false;

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  /** Help shown under the field. */
  @property()
  accessor hint = '';

  /** An error shown under the field. When set, the field is invalid. */
  @property({ reflect: true })
  accessor error = '';

  @query('input, textarea')
  private accessor control!: HTMLInputElement | HTMLTextAreaElement;

  checkValidity() {
    return this.control.checkValidity();
  }

  reportValidity() {
    return this.control.reportValidity();
  }

  override render() {
    const describedBy = [this.hint && 'hint', this.error && 'error'].filter(Boolean).join(' ');
    const control =
      this.type === 'textarea'
        ? html`<textarea
            id="control"
            name="${ifDefined(this.name)}"
            autocomplete="${ifDefined(this.autocomplete)}"
            maxlength="${ifDefined(this.maxlength)}"
            rows="${this.rows}"
            ?required="${this.required}"
            ?disabled="${this.disabled}"
            aria-invalid="${this.error ? 'true' : nothing}"
            aria-describedby="${describedBy || nothing}"
            .value="${live(this.value)}"
            @input="${this.onInput}"
            @change="${this.onChange}"
          ></textarea>`
        : html`<input
            id="control"
            type="${this.type}"
            name="${ifDefined(this.name)}"
            autocomplete="${ifDefined(this.autocomplete)}"
            maxlength="${ifDefined(this.maxlength)}"
            ?required="${this.required}"
            ?disabled="${this.disabled}"
            aria-invalid="${this.error ? 'true' : nothing}"
            aria-describedby="${describedBy || nothing}"
            .value="${live(this.value)}"
            @input="${this.onInput}"
            @change="${this.onChange}"
          />`;
    return html`
      <label for="control">${this.label}</label>
      <div class="control">${control}<slot name="suffix"></slot></div>
      ${this.hint ? html`<p id="hint" class="hint">${this.hint}</p>` : nothing}
      ${this.error ? html`<p id="error" class="error">${this.error}</p>` : nothing}
    `;
  }

  // The native `input` event leaves the shadow root on its own, after this listener.
  private onInput = (event: Event) => {
    this.value = (event.target as HTMLInputElement).value;
  };

  // `change` does not leave the shadow root, so the field fires its own.
  private onChange = () => {
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-text-field': HbTextField;
  }
}
