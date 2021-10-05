import { customElement, property } from '@polymer/decorators'
import '@polymer/iron-icon';
import '@polymer/marked-element';
import '@polymer/paper-icon-button';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import '../elements/shared-styles';

@customElement('location-page')
export class LocationPage extends PolymerElement {

  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }

        .plan {
          width: 100%;
          height: 750px;
        }
      </style>

      <polymer-helmet
        title="{$ heroSettings.location.title $} | {$ title $}"
        description="{$ heroSettings.location.metaDescription $}"
        active="[[active]]"
      ></polymer-helmet>

      <hero-block
        background-image="{$ heroSettings.location.background.image $}"
        background-color="{$ heroSettings.location.background.color $}"
        font-color="{$ heroSettings.location.fontColor $}"
        active="[[active]]"
      >
        <div class="hero-title highlight-font">{$ heroSettings.location.title $}</div>
        <p class="hero-description">{$ heroSettings.location.description $}</p>
      </hero-block>

      <iron-image class="plan" src="../../images/plan.png"sizing="contain" alt="Plan"></iron-image>

      <iron-image class="plan" src="../../images/plan-inside.png"sizing="contain" alt="Plan"></iron-image>

      <iframe
        width="100%"
        height="400"
        frameborder="0" style="border:0"
        src="https://www.google.com/maps/embed/v1/place?key={$ googleMapApiKeyLocationPage $}
        &q=SupagroMontpellier,France&zoom=15" allowfullscreen>
      </iframe>

      <md-content md-source="[[source]]"></md-content>

      <footer-block></footer-block>
    `;
  }

  @property({ type: Boolean })
  active = false;
  @property({ type: String })
  source = '{$ locationText $}';
}
