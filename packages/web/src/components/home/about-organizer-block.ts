import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { msg } from '@lit/localize';
import { aboutOrganizerBlock } from '../../config/site';
import { band } from '../../styles/band';
import { renderMarkdown } from '../../utils/markdown';
import '../shared/hoverboard-icon';
import { ThemedElement } from '../themed-element';
import '../ui/hb-button';

/** The organizers' photo in a frame, and a few short texts about them. */
@customElement('about-organizer-block')
export class AboutOrganizerBlock extends ThemedElement {
  static override styles = [
    band,
    css`
      .layout {
        display: grid;
        gap: var(--hb-space-8);
      }

      .frame {
        display: block;
        align-self: center;
        margin: 0;
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-l);
        overflow: hidden;
        box-shadow: var(--hb-shadow-card);
        rotate: calc(-2deg * var(--hb-decorations, 1));
      }

      .photo {
        display: block;
        inline-size: 100%;
        block-size: auto;
        aspect-ratio: 4 / 3;
        object-fit: cover;
      }

      .blocks {
        display: grid;
        gap: var(--hb-space-7);
      }

      .block h2 {
        margin: 0;
        padding: 0;
        font: 700 var(--hb-text-2xl) / 1.15 var(--hb-font-display);
        overflow-wrap: anywhere;
      }

      .prose {
        max-inline-size: var(--hb-prose-max);
        margin-block: var(--hb-space-2) var(--hb-space-3);
      }

      .prose :first-child {
        margin-block-start: 0;
      }

      @container (width >= 800px) {
        .layout {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        }
      }
    `,
  ];

  override render() {
    const photo = html`
      <img
        class="photo"
        src="${aboutOrganizerBlock.image}"
        alt="${msg('Organizer', { id: 'home.about-organizer-block.photo-alt' })}"
        loading="lazy"
      />
    `;
    return html`
      <div class="inner layout">
        ${
          __HB_FEATURES__.team
            ? html`<a class="frame" href="/team">${photo}</a>`
            : html`<figure class="frame">${photo}</figure>`
        }
        <div class="blocks">
          ${aboutOrganizerBlock.blocks.map(
            (block) => html`
              <div class="block">
                <h2>${block.title}</h2>
                <div class="prose">${unsafeHTML(renderMarkdown(block.description))}</div>
                <hb-button
                  variant="outlined"
                  class="cta-button"
                  href="${block.callToAction.link}"
                  .target="${block.callToAction.newTab ? '_blank' : undefined}"
                  trailing-icon
                >
                  ${block.callToAction.label}
                  <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
                </hb-button>
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
