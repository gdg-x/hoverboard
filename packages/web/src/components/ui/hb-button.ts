import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { primitive, stateLayer } from '../../styles/shared';
import { safeUrl } from '../../utils/safe-url';
import { ariaBoolean, linkRel, stopDisabledClicks } from './controls';

export type ButtonVariant = 'filled' | 'cta' | 'tonal' | 'outlined' | 'text';

/**
 * A button, or a link that looks like one when it has an `href`. The label is the content, and an
 * icon goes in the `icon` slot, before the label or after it with `trailing-icon`. `cta` is for a
 * page's main call to action, in the theme's call to action colors.
 *
 * Colors can be changed with `--hb-button-background`, `--hb-button-color` and
 * `--hb-button-border-color`, for buttons on colored bands.
 */
@customElement('hb-button')
export class HbButton extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, delegatesFocus: true };

  static override styles = [
    primitive,
    stateLayer,
    css`
      :host {
        --hb-button-background: var(--hb-color-primary);
        --hb-button-color: var(--hb-color-on-primary);
        --hb-button-border-color: var(--hb-border-color);
        --hb-button-shadow: var(--hb-shadow-button);

        display: inline-flex;
        vertical-align: middle;
      }

      :host([variant='cta']) {
        --hb-button-background: var(--hb-cta-background);
        --hb-button-color: var(--hb-on-cta);
      }

      :host([variant='tonal']) {
        --hb-button-background: var(--hb-color-primary-container);
        --hb-button-color: var(--hb-color-on-primary-container);
      }

      :host([variant='outlined']) {
        --hb-button-background: transparent;
        --hb-button-color: currentColor;
        --hb-button-border-color: currentColor;
        --hb-button-shadow: none;
      }

      :host([variant='text']) {
        --hb-button-background: transparent;
        --hb-button-color: var(--hb-color-primary);
        --hb-button-border-color: transparent;
        --hb-button-shadow: none;
      }

      .button {
        display: inline-flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        gap: var(--hb-space-2);
        min-block-size: var(--hb-target-min);
        margin: 0;
        padding: var(--hb-space-1) var(--hb-space-5);
        border: var(--hb-border-width) solid var(--hb-button-border-color);
        border-radius: var(--hb-radius-full);
        background-color: var(--hb-button-background);
        color: var(--hb-button-color);
        box-shadow: var(--hb-button-shadow);
        font: 600 var(--hb-text-md) / 1.2 var(--hb-font-body);
        text-align: center;
        text-decoration: none;
        cursor: pointer;
        transition:
          translate var(--hb-duration-short) var(--hb-ease-spring),
          box-shadow var(--hb-duration-short) var(--hb-ease-standard);
      }

      :host([variant='text']) .button {
        padding-inline: var(--hb-space-3);
      }

      :host([size='l']) .button {
        min-block-size: 56px;
        padding-inline: var(--hb-space-6);
        font-size: var(--hb-text-lg);
      }

      .button:active:not(:disabled) {
        translate: var(--hb-press-offset) var(--hb-press-offset);
        box-shadow: none;
      }

      .button:disabled {
        box-shadow: none;
        opacity: var(--hb-button-disabled-opacity, 0.38);
        cursor: default;
      }

      .label {
        overflow-wrap: anywhere;
      }

      slot[name='icon']::slotted(*) {
        flex: none;
        inline-size: 1.25em;
        block-size: 1.25em;
        transition: translate var(--hb-duration-short) var(--hb-ease-spring);
      }

      :host([trailing-icon]) slot[name='icon'] {
        order: 1;
      }

      :host([trailing-icon]) .button:hover slot[name='icon']::slotted(*) {
        translate: 4px 0;
      }

      @media (forced-colors: active) {
        .button {
          border-color: ButtonText;
        }
      }
    `,
  ];

  @property({ reflect: true })
  accessor variant: ButtonVariant = 'filled';

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

  @property({ type: Boolean, reflect: true, attribute: 'trailing-icon' })
  accessor trailingIcon = false;

  /** `aria-expanded`, for buttons that open a menu or a panel. */
  @property({ attribute: false })
  accessor expanded: boolean | undefined;

  /** `aria-haspopup`, for buttons that open a menu. */
  @property({ attribute: false })
  accessor haspopup: string | undefined;

  constructor() {
    super();
    stopDisabledClicks(this);
  }

  override render() {
    const content = html`
      <slot name="icon"></slot>
      <span class="label"><slot></slot></span>
    `;
    const href = safeUrl(this.href);
    if (href !== undefined && !this.disabled) {
      return html`
        <a
          class="button state"
          href="${href}"
          target="${ifDefined(this.target)}"
          rel="${ifDefined(linkRel(this.target, this.rel))}"
          >${content}</a
        >
      `;
    }
    return html`
      <button
        class="button state"
        type="button"
        ?disabled="${this.disabled}"
        aria-expanded="${ifDefined(ariaBoolean(this.expanded))}"
        aria-haspopup="${ifDefined(this.haspopup)}"
      >
        ${content}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-button': HbButton;
  }
}
