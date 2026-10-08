import { msg, updateWhenLocaleChanges } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { primitive } from '../../styles/shared';

/** A progress bar on the native `<progress>`. Without `value`, it shows that something is loading. */
@customElement('hb-progress')
export class HbProgress extends LitElement {
  static override styles = [
    primitive,
    css`
      :host {
        display: block;
      }

      progress {
        display: block;
        inline-size: 100%;
        block-size: 4px;
        border: 0;
        border-radius: var(--hb-radius-full);
        background-color: var(--hb-color-primary-container);
        color: var(--hb-color-primary);
        appearance: none;
        overflow: hidden;
      }

      progress::-webkit-progress-bar {
        background-color: transparent;
      }

      progress::-webkit-progress-value {
        background-color: var(--hb-color-primary);
      }

      progress::-moz-progress-bar {
        background-color: var(--hb-color-primary);
      }

      progress:indeterminate {
        background-image: linear-gradient(var(--hb-color-primary) 0 0);
        background-repeat: no-repeat;
        background-size: 40% 100%;
        animation: indeterminate 1.4s var(--hb-ease-standard) infinite;
      }

      progress:indeterminate::-moz-progress-bar {
        background-color: transparent;
      }

      @keyframes indeterminate {
        from {
          background-position: -100% 0;
        }

        to {
          background-position: 200% 0;
        }
      }

      @media (forced-colors: active) {
        progress {
          border: 1px solid CanvasText;
        }
      }
    `,
  ];

  /** From 0 to `max`. Leave it out while the amount is unknown. */
  @property({ type: Number })
  accessor value: number | undefined;

  @property({ type: Number })
  accessor max = 1;

  @property()
  accessor label: string | undefined;

  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  override render() {
    return html`<progress
      aria-label="${this.label ?? msg('Loading...', { id: 'common.loading' })}"
      max="${this.max}"
      value="${ifDefined(this.value)}"
    ></progress>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hb-progress': HbProgress;
  }
}
