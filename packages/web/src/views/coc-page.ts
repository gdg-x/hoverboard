import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { coc } from '../config/site';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import '../components/hero/simple-hero';
import '../components/markdown/remote-markdown';
import { pageInner } from '../styles/page';
import { ThemedElement } from '../components/themed-element';

@customElement('coc-page')
export class CocPage extends ThemedElement {
  static override styles = pageInner;

  private readonly metadata = new PageMetadataController(this, 'coc');

  /** The code of conduct in the source locale, which the build passes in. */
  @property({ attribute: false })
  accessor content: string | undefined;

  get source() {
    return coc;
  }

  override render() {
    return html`
      <simple-hero page="coc"></simple-hero>

      <div class="inner">
        <remote-markdown
          toc
          path=${this.source}
          page-path="/coc"
          .content=${this.content}
        ></remote-markdown>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'coc-page': CocPage;
  }
}
