import { customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import '../components/hero-block';
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

      <hero-block
        background-image="{$ heroSettings.faq.background.image $}"
        background-color="{$ heroSettings.faq.background.color $}"
        font-color="{$ heroSettings.faq.fontColor $}"
      >
        <div class="hero-title">{$ heroSettings.faq.title $}</div>
        <p class="hero-description">{$ heroSettings.faq.description $}</p>
      </hero-block>

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
