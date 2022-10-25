import { customElement, property } from '@polymer/decorators';
import '@polymer/paper-progress';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import '../components/hero/simple-hero';
import '../components/text-truncate';
import '../elements/content-loader';
import '../elements/footer-block';
import '../elements/posts-list';
import '../elements/shared-styles';
import './blog-list-page';
import './post-page';

@customElement('jobs-page')
export class BlogPage extends PolymerElement {

  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
        }

        * {
          --w3d-main-color: #fb4552;
          --w3d-accent-color: #fff;
        }

      </style>

      <polymer-helmet
        title="{$ heroSettings.location.title $} | {$ title $}"
        description="{$ heroSettings.location.metaDescription $}"
        active="[[active]]"
      ></polymer-helmet>


      <div class="container">
        <jobs-widget
          color="#e83002"
          locale="fr"
          items="40"
          hidePartnership="false"
          hideFooter="false"
          referralCode="SUNNYTECH"
          customAlgoliaFilters="inSelections.-N1gxlLcIUuemCpyXjjH > 0"
          eventMode="true"
        ></jobs-widget>
      </div>

      <footer-block></footer-block>
    `;
  }

  @property({ type: Boolean })
  active = false;
  @property({ type: String })
  source = '{$ locationText $}';

  constructor() {
    super();

    const scriptEle = document.createElement("script");
    scriptEle.setAttribute("src", "https://widget.welovedevs.com/jobs-widget.js");
    scriptEle.setAttribute("type", "module");

    document.body.appendChild(scriptEle);


  }

}
