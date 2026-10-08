import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { faq } from '../config/site';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import '../components/hero/simple-hero';
import '../components/markdown/remote-markdown';
import { ThemedElement } from '../components/themed-element';

@customElement('faq-page')
export class FaqPage extends ThemedElement {
  private readonly metadata = new PageMetadataController(this, 'faq');

  /** The FAQ in the source locale, which the build passes in. */
  @property({ attribute: false })
  accessor content: string | undefined;

  get source() {
    return faq;
  }

  override render() {
    return html`
      <simple-hero page="faq"></simple-hero>

      <remote-markdown
        toc
        path=${this.source}
        page-path="/faq"
        .content=${this.content}
      ></remote-markdown>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'faq-page': FaqPage;
  }
}
