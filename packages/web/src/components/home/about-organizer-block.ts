import '@material/web/button/text-button.js';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { initialUiState } from '../../store/ui';
import { aboutOrganizerBlock } from '../../config/site';
import '../shared/hoverboard-icon';
import '../markdown/short-markdown';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('about-organizer-block')
export class AboutOrganizerBlock extends ThemedElement {
  static override styles = css`
    .container {
      display: flex;
    }

    .block:not(:last-of-type) {
      margin-bottom: 32px;
    }

    .image-column {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      flex-basis: 1px;
    }

    .image-link {
      width: 80%;
      height: 80%;
    }

    .organizers-photo {
      --lazy-image-width: 100%;
      --lazy-image-height: 100%;
      --lazy-image-fit: cover;
      width: var(--lazy-image-width);
      height: var(--lazy-image-height);
    }

    .description {
      color: var(--secondary-text-color);
    }

    .description-block {
      flex: 1;
      flex-basis: 1px;
    }
  `;

  @fromStore((state) => state.ui.viewport)
  private accessor viewport!: typeof initialUiState.viewport;

  override render() {
    const photo = html`
      <img
        loading="lazy"
        decoding="async"
        class="organizers-photo"
        src="${aboutOrganizerBlock.image}"
        alt="Organizer"
      />
    `;
    return html`
      <div class="container">
        <div class="image-column" ?hidden="${this.viewport.isPhone}">
          ${__HB_FEATURES__.team ? html`<a href="/team" class="image-link">${photo}</a>` : photo}
        </div>

        <div class="description-block">
          ${aboutOrganizerBlock.blocks.map(
            (block) => html`
              <div class="block">
                <h2>${block.title}</h2>
                <short-markdown class="description" content="${block.description}"></short-markdown>
                <a
                  href="${block.callToAction.link}"
                  target="${block.callToAction.newTab ? '_blank' : ''}"
                  rel="${block.callToAction.newTab ? 'noopener noreferrer' : ''}"
                >
                  <md-text-button class="cta-button animated icon-right" trailing-icon>
                    <span>${block.callToAction.label}</span>
                    <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
                  </md-text-button>
                </a>
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'about-organizer-block': AboutOrganizerBlock;
  }
}
