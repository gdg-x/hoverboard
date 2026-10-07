import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { faq, heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import '../components/hero/simple-hero';
import '../components/markdown/remote-markdown';
import { ThemedElement } from '../components/themed-element';

@customElement('faq-page')
export class FaqPage extends ThemedElement {
  private heroSettings = heroSettings.faq;

  @property()
  accessor source = faq;

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);
  }

  override render() {
    return html`
      <simple-hero page="faq"></simple-hero>

      <remote-markdown toc path=${this.source}></remote-markdown>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'faq-page': FaqPage;
  }
}
