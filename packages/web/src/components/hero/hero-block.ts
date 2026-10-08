import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ThemedElement } from '../themed-element';

export type HeroTone = '1' | '2' | '3' | '4';

/**
 * Styles for the `.hero-title` and `.hero-description` a page puts in the hero. Pages include them,
 * because their own heading styles win over the hero's `::slotted()` rules.
 */
export const heroText = css`
  .hero-title {
    margin: 0;
    padding: 0;
    font: 800 var(--hb-text-5xl) / 1.05 var(--hb-font-display);
    letter-spacing: -0.01em;
    text-wrap: balance;
    overflow-wrap: anywhere;
  }

  .hero-description {
    max-inline-size: var(--hb-prose-max);
    margin: var(--hb-space-4) 0 0;
    font-size: var(--hb-text-lg);
  }
`;

/**
 * The top of a page: a band in one of the theme's accent colors with the page title (a slotted
 * `.hero-title`, styled by `heroText`), a `.hero-description` and anything else the page adds.
 * With a photo, the text sits on the scrim in the dark scheme's colors, as in the home hero.
 */
@customElement('hero-block')
export class HeroBlock extends ThemedElement {
  static override styles = css`
    :host {
      --hb-hero-background: var(--hb-color-accent-1-container);
      --hb-hero-color: var(--hb-color-on-accent-1-container);

      display: block;
      container-type: inline-size;
    }

    :host([tone='2']) {
      --hb-hero-background: var(--hb-color-accent-2-container);
      --hb-hero-color: var(--hb-color-on-accent-2-container);
    }

    :host([tone='3']) {
      --hb-hero-background: var(--hb-color-accent-3-container);
      --hb-hero-color: var(--hb-color-on-accent-3-container);
    }

    :host([tone='4']) {
      --hb-hero-background: var(--hb-color-accent-4-container);
      --hb-hero-color: var(--hb-color-on-accent-4-container);
    }

    .hero {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      padding: var(--hb-space-8) var(--hb-gutter) var(--hb-space-7);
      background-color: var(--hb-hero-background);
      color: var(--hb-hero-color);
    }

    .pattern::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 0;
      background-image: radial-gradient(
        color-mix(in srgb, currentColor 14%, transparent) 1.5px,
        transparent 1.6px
      );
      background-size: 22px 22px;
      opacity: var(--hb-decorations, 1);
    }

    .photo {
      color-scheme: dark;
      background-color: var(--hb-color-surface);
      color: var(--hb-color-on-surface);
    }

    .photo::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 0;
      background-color: var(--hb-color-scrim);
    }

    .background {
      position: absolute;
      z-index: -2;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }

    .inner {
      max-inline-size: var(--hb-content-max);
      margin-inline: auto;
    }

    @media (forced-colors: active) {
      .pattern::before {
        display: none;
      }
    }
  `;

  @property({ attribute: 'background-image' })
  accessor backgroundImage = '';

  /** The theme accent the band uses. */
  @property({ reflect: true })
  accessor tone: HeroTone = '1';

  override render() {
    const photo = this.backgroundImage;
    return html`
      <div class="hero ${photo ? 'photo' : 'pattern'}">
        ${photo ? html`<img class="background" src="${photo}" alt="" decoding="async" />` : nothing}
        <div class="inner"><slot></slot></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hero-block': HeroBlock;
  }
}
