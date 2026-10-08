import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { heroSettings } from '../../config/site';
import { type Page, pageText } from '../../utils/page-text';
import { ThemedElement } from '../themed-element';
import './hero-block';

// A site can give any page a description in site.json.
const descriptions = heroSettings as Partial<Record<Page, { description?: string }>>;

@customElement('simple-hero')
export class SimpleHero extends ThemedElement {
  @property()
  accessor page: Page = 'notFound';

  override render() {
    const description = descriptions[this.page]?.description;
    return html`
      <hero-block>
        <div class="hero-title">${pageText(this.page).title}</div>
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
