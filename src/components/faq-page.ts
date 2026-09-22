import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { faq, heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './footer-block';
import './hero/simple-hero';
import './markdown/remote-markdown';
import { ThemedElement } from './themed-element';

@customElement('faq-page')
export class FaqPage extends ThemedElement {
  private heroSettings = heroSettings.faq;

  @property()
  source = faq;

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);
  }

  override render() {
    return html`
      <simple-hero page="faq"></simple-hero>

      <remote-markdown toc path=${this.source}></remote-markdown>

      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'faq-page': FaqPage;
  }
}
