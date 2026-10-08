import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { faq } from '../config/site';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import '../components/hero/simple-hero';
import '../components/markdown/remote-markdown';
import { ThemedElement } from '../components/themed-element';

@customElement('faq-page')
export class FaqPage extends ThemedElement {
  private readonly metadata = new PageMetadataController(this, 'faq');

  get source() {
    return faq;
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
