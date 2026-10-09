import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { primitive, stateLayer } from '../../styles/shared';
import { ariaBoolean, linkRel, stopDisabledClicks } from './controls';

/** A button with only an icon, the content. `label` is its accessible name, and is required. */
@customElement('hb-icon-button')
export class HbIconButton extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override styles = [
    primitive,
    stateLayer,
    css`
      :host {
        --hb-icon-button-size: var(--hb-target-min);

        display: inline-flex;
        vertical-align: middle;
      }

      :host([size='l']) {
        --hb-icon-button-size: 56px;
      }

      .button {
        display: inline-grid;
        place-items: center;
        inline-size: var(--hb-icon-button-size);
        block-size: var(--hb-icon-button-size);
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: var(--hb-radius-full);
        background-color: transparent;
        color: inherit;
        font: inherit;
        cursor: pointer;
        transition:
          translate var(--hb-duration-short) var(--hb-ease-spring),
          box-shadow var(--hb-duration-short) var(--hb-ease-standard);
      }

      :host([variant='filled']) .button,
      :host([variant='tonal']) .button {
        border: var(--hb-border-width) solid var(--hb-border-color);
        box-shadow: var(--hb-shadow-button);
      }

      :host([variant='filled']) .button {
        background-color: var(--hb-color-primary);
        color: var(--hb-color-on-primary);
      }

      :host([variant='tonal']) .button {
        background-color: var(--hb-color-primary-container);
        color: var(--hb-color-on-primary-container);
      }

      :host([variant='filled']) .button:active:not(:disabled),
      :host([variant='tonal']) .button:active:not(:disabled) {
        translate: var(--hb-press-offset) var(--hb-press-offset);
        box-shadow: none;
      }

      .button[aria-pressed='true'] {
        color: var(--hb-color-primary);
      }

      .button:disabled {
        box-shadow: none;
        opacity: 0.38;
        cursor: default;
      }

      ::slotted(*) {
        inline-size: 24px;
        block-size: 24px;
      }
    `,
  ];

  @property()
  accessor label = '';

  @property({ reflect: true })
  accessor variant: 'standard' | 'filled' | 'tonal' = 'standard';

  @property({ reflect: true })
  accessor size: 'm' | 'l' = 'm';

  /** Makes the button a link. */
  @property()
  accessor href: string | undefined;

  @property()
  accessor target: string | undefined;

  @property()
  accessor rel: string | undefined;

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  /** `aria-pressed`, for toggle buttons such as a bookmark. */
  @property({ attribute: false })
  accessor pressed: boolean | undefined;

  @property({ attribute: false })
  accessor expanded: boolean | undefined;

  @property({ attribute: false })
  accessor haspopup: string | undefined;

  constructor() {
    super();
    stopDisabledClicks(this);
  }

  override render() {
    if (this.href !== undefined && !this.disabled) {
      return html`
        <a
          class="button state"
          href="${this.href}"
          target="${ifDefined(this.target)}"
          rel="${ifDefined(linkRel(this.target, this.rel))}"
          aria-label="${this.label}"
          ><slot></slot
        ></a>
      `;
    }
    return html`
      <button
        class="button state"
        type="button"
        aria-label="${this.label}"
        ?disabled="${this.disabled}"
        aria-pressed="${ifDefined(ariaBoolean(this.pressed))}"
        aria-expanded="${ifDefined(ariaBoolean(this.expanded))}"
        aria-haspopup="${ifDefined(this.haspopup)}"
      >
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-icon-button': HbIconButton;
  }
}
