import { customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import '../elements/footer-block';
import '../elements/md-content';
import '../elements/polymer-helmet';

@customElement('coc-page')
export class CocPage extends PolymerElement {
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

  @property({ type: Boolean })
  active = false;
  @property({ type: String })
  source = '{$ coc $}';
}
