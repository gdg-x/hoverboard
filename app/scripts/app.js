/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/* global CustomEvent, Polymer */

(function(document) {
  'use strict';

  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  let app = document.getElementById('app');

  // Debug mode
  app.debug = true;

  // Logger for debug mode
  let logger = text => {
    if (app.debug) {
      console.info(text);
    }
  };

  // Conditionally load the webcomponents polyfill if needed by the browser.
  // This feature detect will need to change over time as browsers implement
  // different features.
  var webComponentsSupported = ('registerElement' in document &&
    'import' in document.createElement('link') &&
    'content' in document.createElement('template'));

  function finishLazyLoading() {
    // (Optional) Use native Shadow DOM if it's available in the browser.
    // WARNING! This will mess up the page.js router which uses event delegation
    // and expects to receive events from anchor tags. These events get re-targeted
    // by the Shadow DOM to point to <my-app>
    // window.Polymer = window.Polymer || {dom: 'shadow'};

    // When base-bundle.html with elements is loaded
    var onImportLoaded = function() {
      logger('Imports are loaded and elements have been registered!');
      
      // Remove skeleton
      var skeleton = document.getElementById('skeleton');
      skeleton.remove();

      if (webComponentsSupported) {
        // Emulate WebComponentsReady event for browsers supporting Web Components natively
        // (Chrome, Opera, Vivaldi)
        document.dispatchEvent(
          new CustomEvent('WebComponentsReady', {bubbles: true})
        );
      }
    };

    var elementsBaseBundle = document.getElementById('elementsBaseBundle');

    // Go if the async Import loaded quickly. Otherwise wait for it.
    // crbug.com/504944 - readyState never goes to complete until Chrome 46.
    // crbug.com/505279 - Resource Timing API is not available until Chrome 46.
    if (elementsBaseBundle.import && elementsBaseBundle.import.readyState === 'complete') {
      onImportLoaded();
    } else {
      elementsBaseBundle.addEventListener('load', onImportLoaded);
    }
  }

  if (!webComponentsSupported) {
    logger('Web Components aren\'t supported!');
    var script = document.createElement('script');
    script.async = true;
    script.src = 'bower_components/webcomponentsjs/webcomponents-lite.min.js';
    script.onload = finishLazyLoading;
    document.head.appendChild(script);
  } else {
    logger('Web Components are supported!');
    finishLazyLoading();
  }

  // Listen for template bound event to know when bindings
  // have resolved and content has been stamped to the page
  app.addEventListener('dom-change', () => {
    logger('Our app is ready to rock!');
  });

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', () => {
    /* imports are loaded and elements have been registered */
  });

  window.addEventListener('service-worker-error', e => {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      logger(e.detail);
    }
  });

  window.addEventListener('service-worker-installed', () => {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      app.$.infoToast.text = 'Caching complete! This app will work offline.';
      app.$.infoToast.show();
    }
  });

  window.addEventListener('service-worker-updated', e => {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      logger(e.detail);
    }
  });

  // Main area's paper-scroll-header-panel custom condensing transformation of
  // the headerTitle in the middle-container and the bottom title in the bottom-container.
  // The headerTitle is moved to top and shrunk on condensing. The bottom sub title
  // is shrunk to nothing on condensing.
  window.addEventListener('paper-header-transform', e => {
    let headerTitle = app.querySelector('.Main-headerTitle');
    let headerSubTitle = app.querySelector('.Main-headerSubTitle');
    let headerMiddleBar = app.querySelector('.Main-headerMiddleBar');
    let headerBottomBar = app.querySelector('.Main-headerBottomBar');
    let detail = e.detail;
    let heightDiff = detail.height - detail.condensedHeight;
    let yRatio = Math.min(1, detail.y / heightDiff);
    let yRatio2 = Math.min(1, detail.y / (heightDiff + 30));
    // headerTitle max size when condensed. The smaller the number the smaller the condensed size.
    var maxMiddleScale = 0.70;
    var auxHeight = heightDiff - detail.y;
    var auxScale = heightDiff / (1 - maxMiddleScale);
    var scaleMiddle = Math.max(maxMiddleScale, auxHeight / auxScale + maxMiddleScale);
    var scaleBottom = 1 - yRatio;

    // Move/translate headerMiddleContent and headerBottomContent
    if (window.matchMedia('(min-width: 600px)').matches) {
      Polymer.Base.transform(`translate3d(0,${yRatio2 * 100}%,0)`, headerMiddleBar);
    } else {
      Polymer.Base.transform(`translate3d(${yRatio * 18}px,${yRatio2 * 100}%,0)`,
        headerMiddleBar);
      Polymer.Base.transform(`translate3d(${yRatio * 18}px,0,0)`, headerBottomBar);
    }

    // Scale headerTitle
    Polymer.Base.transform(`scale(${scaleMiddle}) translateZ(0)`, headerTitle);
    // Scale headerSubTitle
    Polymer.Base.transform(`scale(${scaleBottom}) translateZ(0)`, headerSubTitle);
  });

})(document);
