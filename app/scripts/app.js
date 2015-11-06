/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

(function(document) {
  'use strict';

  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  let app = document.querySelector('#app');

  app.displayInstalledToast = () => {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      Polymer.dom(document).querySelector('#toastInfo').text = 'Caching complete! This app will work offline.';
      Polymer.dom(document).querySelector('#toastInfo').show();
    }
  };

  // Listen for template bound event to know when bindings
  // have resolved and content has been stamped to the page
  app.addEventListener('dom-change', () => console.log('Our app is ready to rock!'));

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', () => { /* imports are loaded and elements have been registered */ });

  // Main area's paper-scroll-header-panel custom condensing transformation of
  // the appName in the middle-container and the bottom title in the bottom-container.
  // The appName is moved to top and shrunk on condensing. The bottom sub title
  // is shrunk to nothing on condensing.
  window.addEventListener('paper-header-transform', e => {
    let appName = Polymer.dom(document).querySelector('.Main-headerTitle');
    let middleContainer = Polymer.dom(document).querySelector('.Main-headerMiddleContent');
    let bottomContainer = Polymer.dom(document).querySelector('.Main-headerBottomContent');
    let detail = e.detail;
    let heightDiff = detail.height - detail.condensedHeight;
    let yRatio = Math.min(1, detail.y / heightDiff);
    let maxMiddleScale = 0.50;  // appName max size when condensed. The smaller the number the smaller the condensed size.
    let scaleMiddle = Math.max(maxMiddleScale, (heightDiff - detail.y) / (heightDiff / (1-maxMiddleScale))  + maxMiddleScale);
    let scaleBottom = 1 - yRatio;

    // Move/translate middleContainer
    Polymer.Base.transform(`translate3d(0,${yRatio * 100}%,0)`, middleContainer);

    // Scale bottomContainer and bottom sub title to nothing and back
    Polymer.Base.transform(`scale(${scaleBottom}) translateZ(0)`, bottomContainer);

    // Scale middleContainer appName
    Polymer.Base.transform(`scale(${scaleMiddle}) translateZ(0)`, appName);
  });

  // Close drawer after menu item is selected if drawerPanel is narrow
  app.onDataRouteClick = function() {
    let drawerPanel = Polymer.dom(document).querySelector('#paperDrawerPanel');
    if (drawerPanel.narrow) {
      drawerPanel.closeDrawer();
    }
  };

  // Hide toastConfirm after tap on OK button 
  app.onToastConfirmTap = () => app.$.toastConfirm.hide();

  // Scroll page to top and expand header
  app.scrollPageToTop = () => app.$.headerPanelMain.scrollToTop(true);

})(document);
