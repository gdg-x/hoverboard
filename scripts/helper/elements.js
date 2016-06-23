/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

HOVERBOARD.Elements = (function() {
  'use strict';

  const ANALYTICS_LINK_ATTR = 'data-track-link';

  // Called from critical.html when the bundle is loaded.
  function onElementsBundleLoaded() {
    var onPageSelect = function() {
      document.body.removeEventListener('page-select', onPageSelect);

      // Deep link into a subpage.
      var selectedPageEl = HOVERBOARD.Elements.LazyPages.selectedPage;
      var parsedUrl = HOVERBOARD.Router.parseUrl(window.location.href);
      // Select page's default subpage tab if there's no deep link in the URL.
      selectedPageEl.selectedSubpage = parsedUrl.subpage || selectedPageEl.selectedSubpage;

      var subpage = document.querySelector(
          '.subpage-' + selectedPageEl.selectedSubpage);

      HOVERBOARD.PageAnimation.play(
        HOVERBOARD.PageAnimation.pageFirstRender(subpage), function() {
          // Let page know transitions are done.
          HOVERBOARD.Elements.Template.fire('page-transition-done');
          HOVERBOARD.ServiceWorkerRegistration.register();
        }
      );
    };

    if (HOVERBOARD.Elements && HOVERBOARD.Elements.LazyPages &&
        HOVERBOARD.Elements.LazyPages.selectedPage) {
      onPageSelect();
    } else {
      document.body.addEventListener('page-select', onPageSelect);
    }
  }

  function onDomBindStamp() {
    var toast = document.getElementById('toast');

    HOVERBOARD.Elements.Toast = toast;
    HOVERBOARD.Elements.ScrollContainer = window;
    HOVERBOARD.Elements.Scroller = document.documentElement;
  }

  function init() {
    var template = document.getElementById('t');

    template.app = {};
    template.app.isIOS = HOVERBOARD.Util.isIOS();
    template.app.isAndroid = HOVERBOARD.Util.isAndroid();
    template.app.isSafari = HOVERBOARD.Util.isSafari();
    template.app.ANALYTICS_LINK_ATTR = ANALYTICS_LINK_ATTR;

    // FAB scrolling effect caches.
    template._fabCrossFooterThreshold = null; // Scroll limit when FAB sticks.
    template._fabBottom = null; // Bottom to pin FAB at.

    template.backToTop = function(e) {
      e.preventDefault();

      Polymer.AppLayout.scroll({
        top: 0,
        behavior: 'smooth',
        target: HOVERBOARD.Elements.Scroller
      });

      // Kick focus back to the page
      // User will start from the top of the document again
      e.target.blur();
    };

    template.toggleDrawer = function() {
      this.$.appdrawer.toggle();
    };

    template._isPage = function(page, selectedPage) {
      return page === selectedPage;
    };

    template.closeDrawer = function() {
      if (this.$.appdrawer && this.$.appdrawer.close) {
        this.$.appdrawer.close();
      }
    };

    HOVERBOARD.Elements.Template = template;
  }

  return {
    init,
    onElementsBundleLoaded
  };
})();
