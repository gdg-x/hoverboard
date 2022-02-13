import { customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import '../components/hero/simple-hero';
import '../components/markdown/remote-markdown';
import '../elements/footer-block';
import { updateMetadata } from '../utils/metadata';

@customElement('coc-page')
export class CocPage extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>

      <simple-hero page="coc"></simple-hero>

      <remote-markdown toc path="[[source]]"></remote-markdown>

      <footer-block></footer-block>
    `;
  }

  @property({ type: String })
  source = '{$ coc $}';

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata('{$ heroSettings.coc.title $}', '{$ heroSettings.coc.metaDescription $}');
  }
}
