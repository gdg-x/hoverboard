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

window.HOVERBOARD = window.HOVERBOARD || {};

/**
 * Log to console if not in production.
 * @param {...*} var_args
 */
window.debugLog = function debugLog(var_args) {
  'use strict';

  if (window.ENV !== 'prod') {
    console.log.apply(console, arguments);
  }
};

HOVERBOARD.Util = HOVERBOARD.Util || (function () {
    'use strict';

    /**
     * Create a deferred object, allowing a Promise to be fulfilled at a later
     * time.
     * @return {{promise: !Promise, resolve: function(), reject: function()}} A deferred object, allowing a Promise to be fulfilled at a later time.
     */
    function createDeferred() {
      var resolveFn;
      var rejectFn;
      var promise = new Promise(function (resolve, reject) {
        resolveFn = resolve;
        rejectFn = reject;
      });
      return {
        promise: promise,
        resolve: resolveFn,
        reject: rejectFn
      };
    }

    function isIOS() {
      return (/(iPhone|iPad|iPod)/gi).test(navigator.platform);
    }

    function isAndroid() {
      return (/Android/gi).test(navigator.userAgent);
    }

    function isSafari() {
      var userAgent = navigator.userAgent;
      return (/Safari/gi).test(userAgent) && !(/Chrome/gi).test(userAgent);
    }

    function isIE() {
      var userAgent = navigator.userAgent;
      return (/Trident/gi).test(userAgent);
    }

    function isEdge() {
      return /Edge/i.test(navigator.userAgent);
    }

    function isFF() {
      var userAgent = navigator.userAgent;
      return (/Firefox/gi).test(userAgent);
    }

    function isTouchScreen() {
      return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
    }

    /**
     * Sets the <meta name="theme-color"> to the specified value.
     * @param {string} color Color hex value.
     */
    function setMetaThemeColor(color) {
      var metaTheme = document.documentElement.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.content = color;
      }
    }

    /**
     * Reports an error to Google Analytics.
     * Normally, this is done in the window.onerror handler, but this helper method can be used in the
     * catch() of a promise to log rejections.
     * @param {Error|string} error The error to report.
     */
    var reportError = function (error) {
      // Google Analytics has a max size of 500 bytes for the event location field.
      // If we have an error with a stack trace, the trailing 500 bytes are likely to be the most
      // relevant, so grab those.
      var location = (error && typeof error.stack === 'string') ?
        error.stack.slice(-500) : 'Unknown Location';
      HOVERBOARD.Analytics.trackError(location, error);
    };

    /**
     * Returns the target element that was clicked/tapped.
     * @param {Event} e The click/tap event.
     * @param {string} tagName The element tagName to stop at.
     * @return {Element} The target element that was clicked/tapped.
     */
    var getEventSender = function (e, tagName) {
      var path = Polymer.dom(e).path;

      var target = null;
      for (var i = 0; i < path.length; ++i) {
        var el = path[i];
        if (el.localName === tagName) {
          target = el;
          break;
        }
      }

      return target;
    };

    /**
     * Returns the first paint metric (if available).
     * @return {number} The first paint time in ms.
     */
    const getFPIfSupported = function () {
      if (window.chrome && window.chrome.loadTimes) {
        let load = window.chrome.loadTimes();
        let fp = (load.firstPaintTime - load.startLoadTime) * 1000;
        return Math.round(fp);
      } else if ('performance' in window) {
        let navTiming = window.performance.timing;
        // See http://msdn.microsoft.com/ff974719
        if (navTiming && navTiming.msFirstPaint && navTiming.navigationStart !== 0) {
          // See http://msdn.microsoft.com/ff974719
          return navTiming.msFirstPaint - navTiming.navigationStart;
        }
      }

      return null;
    };

    /**
     * Returns the Chrome version number.
     * @return {Number} The Chrome version number.
     */
    var getChromeVersion = function () {
      var raw = navigator.userAgent.match(/Chrome\/([0-9]+)\./);
      return raw ? parseInt(raw[1], 10) : false;
    };

    /**
     * Returns the Firefox version number.
     * @return {Number} The Firefox version number.
     */
    var getFirefoxVersion = function () {
      var raw = navigator.userAgent.match(/Firefox\/([0-9]+)\./);
      return raw ? parseInt(raw[1], 10) : false;
    };

    var extend = function(obj1, obj2) {
      if(!obj1) obj1 = {};
      for (var i in obj2) {
        if (obj2.hasOwnProperty(i)) {
          obj1[i] = obj2[i];
        }
      }
      return obj1;
    };

    return {
      createDeferred,
      isFF,
      isIE,
      isEdge,
      isIOS,
      isAndroid,
      isSafari,
      isTouchScreen,
      setMetaThemeColor,
      supportsHTMLImports: 'import' in document.createElement('link'),
      getFPIfSupported,
      getEventSender,
      reportError,
      getChromeVersion,
      getFirefoxVersion,
      extend
    };
  })();
