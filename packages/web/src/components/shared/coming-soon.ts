import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../ui/hb-button';
import { ThemedComponent } from '../themed-component';

/** Shown on a page whose content isn't out yet: the slotted message and a way to get updates. */
@customElement('coming-soon')
export class ComingSoon extends ThemedComponent {
  static override styles = css`
    :host {
      display: grid;
      justify-items: start;
      gap: var(--hb-space-3);
      padding-block: var(--hb-space-6);
    }

    p {
      margin: 0;
      font-size: var(--hb-text-lg);
    }
  `;

  override render() {
    return html`
      <p><slot></slot></p>
      ${
        __HB_FEATURES__.subscribe
          ? html`<hb-button variant="tonal" href="/#subscribe">
              ${msg('Get updates', { id: 'shared.coming-soon.get-updates' })}
            </hb-button>`
          : nothing
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'coming-soon': ComingSoon;
  }
}
