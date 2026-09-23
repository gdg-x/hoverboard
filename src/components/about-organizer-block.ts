import '@material/web/button/text-button.js';
import '@power-elements/lazy-image';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { initialUiState } from '../store/ui';
import { aboutOrganizerBlock } from '../utils/data';
import './hoverboard-icon';
import './markdown/short-markdown';
import { ThemedElement } from './themed-element';

@customElement('about-organizer-block')
export class AboutOrganizerBlock extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        .block:not(:last-of-type) {
          margin-bottom: 32px;
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
      `,
    ];
  }

  @state()
  private viewport = initialUiState.viewport;

  override stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
  }

  override render() {
    return html`
      <div class="container" layout horizontal>
        <div layout horizontal center-center flex ?hidden="${this.viewport.isPhone}">
          <a href="/team" class="image-link">
            <lazy-image
              class="organizers-photo"
              src="${aboutOrganizerBlock.image}"
              alt="Organizer"
            ></lazy-image>
          </a>
        </div>

        <div class="description-block" flex>
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
