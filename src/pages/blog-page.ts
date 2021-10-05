import '@polymer/app-route/app-route';
import { customElement, observe, property } from '@polymer/decorators';
import '@polymer/iron-pages';
import { html, PolymerElement } from '@polymer/polymer';
import { setSubRoute } from '../store/routing/actions';
import { scrollToY } from '../utils/scrolling';
import './blog-list-page';
import './post-page';

@customElement('blog-page')
export class BlogPage extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          height: 100%;
        }

        iron-pages {
          min-height: 100%;
        }
      </style>
      <app-route
        route="[[_route]]"
        pattern="/:page"
        data="{{routeData}}"
        tail="{{subRoute}}"
      ></app-route>

      <iron-pages
        attr-for-selected="data-route"
        selected="[[routeData.page]]"
        selected-attribute="active"
      >
        <blog-list-page data-route></blog-list-page>
        <post-page data-route="posts" route="[[subRoute]]"></post-page>
      </iron-pages>
      <footer-block></footer-block>
    `;
  }

  @property({ type: Boolean })
  active = false;
  @property({ type: Object })
  route = {};

  @property({ type: Object })
  private routeData: { page?: string } = {};
  @property({ type: Object })
  private subRoute: Object;
  @property({ type: Object })
  private _route: Object;

  @observe('active', 'route')
  _routeChanged(active: boolean, route: string) {
    if (active && route) {
      scrollToY(0, 200);
      this.subRoute = {};
      this._route = route;
      setSubRoute(this.routeData.page);
    }
  }
}
