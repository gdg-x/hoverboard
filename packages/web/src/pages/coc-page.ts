import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { coc } from '../config/site';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import '../components/hero/simple-hero';
import '../components/markdown/remote-markdown';
import { ThemedElement } from '../components/themed-element';

@customElement('coc-page')
export class CocPage extends ThemedElement {
  private readonly metadata = new PageMetadataController(this, 'coc');

  get source() {
    return coc;
  }

  override render() {
    return html`
      <simple-hero page="coc"></simple-hero>

      <remote-markdown toc path=${this.source}></remote-markdown>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'coc-page': CocPage;
  }
}
