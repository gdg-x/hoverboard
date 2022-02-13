import { customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import '../components/hero/simple-hero';
import '../components/markdown/remote-markdown';
import '../elements/footer-block';
import { updateMetadata } from '../utils/metadata';

@customElement('faq-page')
export class FaqPage extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>

      <simple-hero page="faq"></simple-hero>

      <remote-markdown toc path="[[source]]"></remote-markdown>

      <footer-block></footer-block>
    `;
  }

  @property({ type: String })
  source = '{$ faq $}';

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(
      '{$ heroSettings.faq.title $} | {$ title $}',
      '{$ heroSettings.faq.metaDescription $}'
    );
  }
}
