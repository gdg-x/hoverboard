import '@polymer/app-route/app-route.js';
import '@polymer/iron-pages';
import { html, PolymerElement } from '@polymer/polymer';
import { ScrollFunctions } from '../mixins/scroll-functions.js';
import { routingActions } from '../redux/actions.js';
import './blog-list-page.js';
import './post-page.js';

class BlogPage extends ScrollFunctions(PolymerElement) {
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
    <app-route route="[[_route]]" pattern="/:page" data="{{routeData}}" tail="{{subRoute}}"></app-route>

    <iron-pages attr-for-selected="data-route" selected="[[routeData.page]]" selected-attribute="active">
      <blog-list-page data-route data-path="./blog-list-page.html"></blog-list-page>
      <post-page data-route="posts" data-path="./post-page.html" route="[[subRoute]]"></post-page>
    </iron-pages>
    <footer-block></footer-block>
`;
  }

  static get is() {
    return 'blog-page';
  }

  static get properties() {
    return {
      route: Object,
      active: Boolean,
    };
  }

  static get observers() {
    return [
      '_routeChanged(active, route)',
    ];
  }

  _routeChanged(active, route) {
    if (active && route) {
      this.scrollToY(0, 200);
      this.set('subRoute', {});
      this.set('_route', route);
      routingActions.setSubRoute(this.routeData.page);
    }
  }
}

window.customElements.define(BlogPage.is, BlogPage);
