import { customElement, property } from '@polymer/decorators';
import '@polymer/paper-progress';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import '../components/hero/simple-hero';
import '../components/text-truncate';
import '../elements/content-loader';
import '../elements/footer-block';
import '../elements/posts-list';
import '../components/markdown/remote-markdown';
import '../elements/shared-styles';
import './blog-list-page';
import './post-page';
import {CONFIG, getConfig} from '../utils/config'
import { locationText } from '../utils/data';

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


      <simple-hero page="location"></simple-hero>
<!--      -->
<!--      <hero-block-->
<!--        background-image="{$ heroSettings.location.background.image $}"-->
<!--        background-color="{$ heroSettings.location.background.color $}"-->
<!--        font-color="{$ heroSettings.location.fontColor $}"-->
<!--        active="[[active]]"-->
<!--      >-->
<!--        <div class="hero-title highlight-font">{$ heroSettings.location.title $}</div>-->
<!--        <p class="hero-description">{$ heroSettings.location.description $}</p>-->
<!--      </hero-block>-->

      <lazy-image class="plan" src="../../images/plan.png" sizing="contain" alt="Plan"></lazy-image>
      <lazy-image class="plan" src="../../images/plan-inside.png" sizing="contain" alt="Plan"></lazy-image>

      <iframe
        width="100%"
        height="400"
        frameborder="0" style="border:0"
        src="https://www.google.com/maps/embed/v1/place?key=[[ googleMapApiKey ]]&q=SupagroMontpellier,France&zoom=15" allowfullscreen>
      </iframe>

      <remote-markdown path="[[source]]"></remote-markdown>

      <footer-block></footer-block>
    `;
  }

  @property({ type: Boolean })
  active = false;
  @property({ type: String })
  source = locationText;

  private googleMapApiKey = getConfig(CONFIG.GOOGLE_MAPS_API_KEY);


}
