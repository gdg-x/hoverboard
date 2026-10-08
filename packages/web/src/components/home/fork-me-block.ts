import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ThemedElement } from '../themed-element';
import '../shared/hoverboard-icon';
import '../ui/hb-button';

@customElement('fork-me-block')
export class ForkMeBlock extends ThemedElement {
  static override styles = css`
    :host {
      display: flex;
      width: 100%;
      background: var(--accent-color);
      color: var(--text-secondary-color);
      padding: 16px 0;
    }
  `;

  override render() {
    return html`
      <div class="container container-narrow">
        <h1 class="container-title">
          ${msg('Fork me on GitHub', { id: 'home.fork-me-block.title' })}
        </h1>
        <p>
          ${msg(
            "Hoverboard is open source conference website template and is developed entirely on a voluntary basis. You can check the source code that generated this website on Github. If you find a issue or you want to contribute, you're more than welcome!",
            { id: 'home.fork-me-block.description' },
          )}
        </p>
        <div class="cta-button">
          <hb-button variant="outlined" href="https://github.com/gdg-x/hoverboard" trailing-icon>
            <span class="cta-label">
              ${msg('Fork this project', { id: 'home.fork-me-block.cta' })}
            </span>
            <hoverboard-icon slot="icon" name="github"></hoverboard-icon>
          </hb-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fork-me-block': ForkMeBlock;
  }
}
