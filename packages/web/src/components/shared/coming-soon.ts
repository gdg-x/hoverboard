import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { callForPapers } from '../../config/site';
import { currentTime } from '../../utils/clock';
import { callForPapersOpen } from '../../utils/next-step';
import '../ui/hb-button';
import { ThemedComponent } from '../themed-component';

/**
 * Shown on a page whose content isn't out yet: the slotted message, a way to get updates, and with
 * `call-for-papers`, a link to submit a talk while the call is open.
 */
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

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--hb-space-3);
    }
  `;

  @property({ type: Boolean, attribute: 'call-for-papers' })
  accessor callForPapers = false;

  // Depends on the time, so it is only set in the browser.
  @state()
  private accessor callOpen = false;

  override firstUpdated() {
    this.callOpen = this.callForPapers && callForPapersOpen(currentTime());
  }

  override render() {
    return html`
      <p><slot></slot></p>
      <div class="actions">
        ${
          this.callOpen
            ? html`<hb-button variant="cta" href="${callForPapers!.url}" target="_blank">
                ${msg('Submit a talk', { id: 'common.submit-talk' })}
              </hb-button>`
            : nothing
        }
        ${
          __HB_FEATURES__.subscribe
            ? html`<hb-button variant="tonal" href="/#subscribe">
                ${msg('Get updates', { id: 'common.get-updates' })}
              </hb-button>`
            : nothing
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'coming-soon': ComingSoon;
  }
}
