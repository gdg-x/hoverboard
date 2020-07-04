import { html, PolymerElement } from '@polymer/polymer';
import '../elements/footer-block';
import '../elements/md-content';
import '../elements/polymer-helmet';

class CocPage extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>

      <polymer-helmet
        title="{$ heroSettings.coc.title $} | {$ title $}"
        description="{$ heroSettings.coc.metaDescription $}"
        active="[[active]]"
      ></polymer-helmet>

      <hero-block
        background-image="{$ heroSettings.coc.background.image $}"
        background-color="{$ heroSettings.coc.background.color $}"
        font-color="{$ heroSettings.coc.fontColor $}"
        active="[[active]]"
      >
        <div class="hero-title">{$ heroSettings.coc.title $}</div>
        <p class="hero-description">{$ heroSettings.coc.description $}</p>
      </hero-block>

      <md-content md-source="[[source]]"></md-content>

      <footer-block></footer-block>
    `;
  }

  static get is() {
    return 'coc-page';
  }

  static get properties() {
    return {
      active: Boolean,
      source: {
        type: String,
        value: '{$ coc $}',
      },
    };
  }
}

window.customElements.define(CocPage.is, CocPage);
