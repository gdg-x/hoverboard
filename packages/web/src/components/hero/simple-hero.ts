import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { heroDescriptions } from '../../config/site';
import { type Page, pageText } from '../../utils/page-text';
import { ThemedElement } from '../themed-element';
import './hero-block';
import { type HeroTone, heroText } from './hero-block';

/** Each section has its own accent color, so pages are easy to tell apart. */
export const PAGE_TONES: Readonly<Record<Page, HeroTone>> = {
  speakers: '1',
  previousSpeakers: '1',
  blog: '2',
  schedule: '3',
  team: '4',
  faq: '4',
  coc: '4',
  notFound: '2',
  offline: '2',
};

@customElement('simple-hero')
export class SimpleHero extends ThemedElement {
  static override styles = heroText;

  @property()
  accessor page: Page = 'notFound';

  override render() {
    // A site can give any page a description in content/resources.json.
    const description = (heroDescriptions as Partial<Record<Page, string>>)[this.page];
    return html`
      <hero-block tone="${PAGE_TONES[this.page]}">
        <h1 class="hero-title">${pageText(this.page).title}</h1>
        ${description ? html`<p class="hero-description">${description}</p>` : nothing}

        <slot></slot>
      </hero-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'simple-hero': SimpleHero;
  }
}
