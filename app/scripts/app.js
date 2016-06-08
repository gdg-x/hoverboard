(function (document) {
  'use strict';

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

})(document);
