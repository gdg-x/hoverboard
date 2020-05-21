import '@polymer/app-route/app-route';
import '@polymer/iron-pages';
import { html, PolymerElement } from '@polymer/polymer';
import { routingActions } from '../redux/actions';
import { scrollToY } from '../utils/scrolling';
import './blog-list-page';
import './post-page';

class BlogPage extends PolymerElement {
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

  static get is() {
    return 'blog-page';
  }

  active = false;
  route = {};

  private routeData: { page?: string } = {};
  private subRoute: Object;
  private _route: Object;

  static get properties() {
    return {
      route: Object,
      active: Boolean,
      routeData: Object,
      subRoute: Object,
      _route: Object,
    };
  }

  static get observers() {
    return ['_routeChanged(active, route)'];
  }

  _routeChanged(active, route) {
    if (active && route) {
      scrollToY(0, 200);
      this.set('subRoute', {});
      this.set('_route', route);
      routingActions.setSubRoute(this.routeData.page);
    }
  }
}

window.customElements.define(BlogPage.is, BlogPage);
