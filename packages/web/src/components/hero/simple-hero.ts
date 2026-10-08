import { html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { heroDescriptions } from '../../config/site';
import { type Page, pageText } from '../../utils/page-text';
import { ThemedElement } from '../themed-element';
import './hero-block';

@customElement('simple-hero')
export class SimpleHero extends ThemedElement {
  @property()
  accessor page: Page = 'notFound';

  override render() {
    // A site can give any page a description in content/resources.json.
    const description = (heroDescriptions as Partial<Record<Page, string>>)[this.page];
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
