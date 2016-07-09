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

HOVERBOARD.Elements = (function () {
  'use strict';

  const ANALYTICS_LINK_ATTR = 'data-track-link';

  // Called from critical.html when the bundle is loaded.
  function onElementsBundleLoaded() {
    var onPageSelect = function () {
      document.body.removeEventListener('page-select', onPageSelect);

      // Deep link into a subpage.
      var selectedPageEl = HOVERBOARD.Elements.LazyPages.selectedPage;
      var parsedUrl = HOVERBOARD.Router.parseUrl(window.location.href);
      // Select page's default subpage tab if there's no deep link in the URL.
      selectedPageEl.selectedSubpage = parsedUrl.subpage || selectedPageEl.selectedSubpage;

      var subpage = document.querySelector(
        '.subpage-' + selectedPageEl.selectedSubpage);

      HOVERBOARD.PageAnimation.play(
        HOVERBOARD.PageAnimation.pageFirstRender(subpage), function () {
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
    var template = document.getElementById('t');
    var toast = document.getElementById('toast');

    HOVERBOARD.Elements.Toast = toast;
    HOVERBOARD.Elements.ScrollContainer = window;
    HOVERBOARD.Elements.Scroller = document.documentElement;
  }

  function init() {
    HOVERBOARD.Elements.Template = document.getElementById('happ');
  }

  return {
    init,
    onElementsBundleLoaded
  };
})();
