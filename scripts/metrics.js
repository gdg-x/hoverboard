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

HOVERBOARD.Analytics = HOVERBOARD.Analytics || (function (exports) {
    'use strict';

    /**
     * Analytics for the I/O Web App.
     * @constructor
     */
    function Analytics() {
      this.setTrackerDefaults();
      this.initTrackerReadyState();

      // Tracks the initial pageview.
      this.trackPageView();

      // Tracks perf events that were marked in the template code. Changes here
      // must also be made in `layout_full.html`.
      this.trackPerfEvent('HTMLImportsLoaded', 'Polymer');
      this.trackPerfEvent('WebComponentsReady', 'Polymer');

      this.trackOnlineStatus();
      this.trackServiceWorkerControlled();

      var matches = exports.location.search.match(/utm_error=([^&]+)/);
      if (matches) {
        // Assume that the only time we'll be setting utm_error= is from the notification code.
        this.trackError('notification', decodeURIComponent(matches[1]));
      }

      /**
       * A collection of timing categories, each a collection of start times.
       * @private {!Object<string, Object<string, ?number>}
       */
      this.startTimes_ = {};
    }

    Analytics.prototype.POLYMER_ANALYTICS_TIMEOUT_ = 60 * 1000;
    Analytics.prototype.FP_TIMEOUT_ = 6 * 1000;
    Analytics.prototype.READY_STATE_TIMEOUT_ = 5 * 1000;
    Analytics.prototype.NULL_DIMENSION = '(not set)';

    // A map from each custom dimension name to its index in Google Analytics.
    Analytics.prototype.customDimensions = {
      SIGNED_IN: 'dimension1',
      ONLINE: 'dimension2',
      SERVICE_WORKER_STATUS: 'dimension3',
      NOTIFICATION_PERMISSION: 'dimension4',
      METRIC_VALUE: 'dimension5'
    };

    // A list of dimensions that must be set before the first hit is sent.
    Analytics.prototype.requiredDimensions = [
      Analytics.prototype.customDimensions.SIGNED_IN,
      Analytics.prototype.customDimensions.ONLINE,
      Analytics.prototype.customDimensions.SERVICE_WORKER_STATUS,
      Analytics.prototype.customDimensions.NOTIFICATION_PERMISSION
    ];

    /**
     * Sets a default value for each custom dimension. This is necessary because
     * GA reports only include results if the result includes a value for every
     * dimension requested.
     */
    Analytics.prototype.setTrackerDefaults = function () {
      Object.keys(this.customDimensions).forEach(function (key) {
        ga('set', this.customDimensions[key], this.NULL_DIMENSION);
      }.bind(this));
    };

    /**
     * Creates a ready state deferred whose promise will be resolved once all
     * custom dimensions are set on the tracker. The promise is resolved in the
     * `updateTracker` method.
     * Exposing the resolve function outside of the closure is required since
     * code outside of this module (`<google-signin>`) calls `updateTracker`.
     * Note: setting custom dimensions needs to happen prior to sending the first
     * pageview, to ensure all hits can be grouped by these custom dimensions.
     */
    Analytics.prototype.initTrackerReadyState = function () {
      this.readyState_ = HOVERBOARD.Deferred.createDeferred();

      // In the event of an error or a failure in the auth code, we set a
      // timeout so the promise always resolves. In such cases, some hits
      // will be sent with missing custom dimension values, but that's better
      // than them not being sent at all.
      setTimeout(function() {
        this.readyState_.resolve();

        // Tracks that this happened and when it happened.
        this.trackEvent('analytics', 'timeout', this.READY_STATE_TIMEOUT_,
          window.performance && Math.round(window.performance.now()));
      }.bind(this), this.READY_STATE_TIMEOUT_);
    };

    /**
     * Updates the tracker field with the specified value.
     * This logic also checks to see if all required dimension values have been
     * set and if so, resolves the ready state so future tracking calls happen
     * right away.
     * @param {string} field The analytics.js field name.
     * @param {value} value The field's value.
     */
    Analytics.prototype.updateTracker = function (field, value) {
      ga(function(tracker) {
        ga('set', field, value); // Use the command queue for easier debugging.
        var requiredDimensionKeys = Object.keys(this.requiredDimensions);
        var hasAllRequiredDimensions = requiredDimensionKeys.every(function (key) {
          tracker.get(this.requiredDimensions[key]) !== this.NULL_DIMENSION;
        }.bind(this));

        if (hasAllRequiredDimensions) {
          this.readyState_.resolve();
        }
      });
    };

    /**
     * Waits until the tracker's ready state promise has been resolved.
     * This happens once all custom dimension values have been set.
     * @return {Promise}
     */
    Analytics.prototype.waitForTrackerReady = function () {
      return this.readyState_.promise;
    };

    /**
     * Updates the tracker with the passed page path and sends a pageview.
     * Page view tracking is throttled to prevent logging page redirects by the
     * URL router.
     * @param {string} opt_path The URL path value.
     * @param {function} opt_callback Optional callback to be invoked after the
     *                   hit is recorded.
     */
    Analytics.prototype.trackPageView = function (opt_path, opt_callback) {
      this.waitForTrackerReady().then(function () {
        if (opt_path) {
          ga('set', 'page', opt_path);
        }
        ga('send', 'pageview', {hitCallback: opt_callback});
      });
    };

    /**
     * Tracks a performance timing. See
     * https://developers.google.com/analytics/devguides/collection/analyticsjs/user-timings
     * @param {string} category Category of timing (e.g. 'Polymer')
     * @param {string} variable Name of the timing (e.g. 'polymer-ready')
     * @param {number} time Time, in milliseconds.
     * @param {string=} opt_label An optional sublabel, for e.g. A/B test identification.
     * @param {number=} opt_maxTime An optional max time, after which '- outliers' will be appended to variable name.
     * @param {object=} opt_obj Optional field object for additional params to send to GA.
     */
    Analytics.prototype.trackPerf = function (category, variable, time, opt_label, opt_maxTime, opt_obj) {
      this.waitForTrackerReady().then(function() {
        if (opt_maxTime !== null && time > opt_maxTime) {
          variable += ' - outliers';
        }
        time = parseInt(time, 10);
        opt_label = opt_label || this.NULL_DIMENSION;

        // Sets the time value as a dimension so it can be more usefully reported
        // on (e.g. median, distribution, etc).
        opt_obj = opt_obj || {};
        opt_obj[this.customDimensions.METRIC_VALUE] = time;

        // Sends an event and a timing hit. We keep the timing hit for historical
        // reasons, but since timing hits get sampled at processing time, and
        // their values can't be used in segments, events are more useful and
        // more accurate.
        ga('send', 'event', category, variable, opt_label, time, opt_obj);
        ga('send', 'timing', category, variable, time, opt_label, opt_obj);
      });
    };

    /**
     * Tracks an event
     *
     * @param {string} category
     * @param {string} action
     * @param {string=} opt_label
     * @param {number=} opt_value
     * @param {function()} opt_callback Optional callback to be invoked after the
     *                   hit is recorded.
     */
    Analytics.prototype.trackEvent = function (category, action, opt_label, opt_value, opt_callback) {
      this.waitForTrackerReady().then(function() {
        ga('send', {
          hitType: 'event',
          eventCategory: category,
          eventAction: action,
          eventLabel: opt_label || this.NULL_DIMENSION,
          eventValue: opt_value,
          hitCallback: opt_callback
        });
      }.bind(this));
    };

    /**
     * Tracks an error event.
     *
     * @param {string} location
     * @param {string} message
     */
    Analytics.prototype.trackError = function (location, message) {
      this.waitForTrackerReady().then(function () {
        ga('send', 'event', 'error', location, String(message));

        // Note: GA has exception type but it does not show up in realtime so catching
        // errors would be 24hrs delayed. Stick with an error event until we decide
        // to switch. It also looks difficult to get this data out later on:
        // http://stackoverflow.com/questions/21718481/report-for-exceptions-from-google-analytics-analytics-js-exception-tracking
        // ga('send', 'exception', {
        //   //'exFatal': true,
        //   'exDescription': location + ' ' + String(message)
        // });
      });
    };

    /**
     * Tracks a social action
     *
     * @param {string} network
     * @param {string} action
     * @param {string} target
     */
    Analytics.prototype.trackSocial = function (network, action, target) {
      this.waitForTrackerReady().then(function () {
        ga('send', 'social', network, action, target);
      });
    };

    /**
     * Log Polymer startup performance numbers.
     */
    Analytics.prototype.trackPerfEvent = function (eventName, categoryName) {
      // The User Timing API is not supported in some browsers; we ignore those.
      // TODO(bckenny): for now, only do polymer perf analytics in browsers with it.
      if (!(exports.performance && exports.performance.getEntriesByName)) {
        return;
      }

      var marks = performance.getEntriesByName(eventName, 'mark');
      if (marks.length) {
        var time = marks[0].startTime;
        debugLog(eventName, '@', time);
        this.trackPerf(categoryName, eventName, time, null,
          this.POLYMER_ANALYTICS_TIMEOUT_);
      } else {
        document.addEventListener(eventName,
          this.trackPerfEvent.bind(this, eventName, categoryName));
      }
    };

    /**
     * Stores a start time associated with a category and variable name. When an
     * end time is registered with matching variables, the time difference is
     * sent to analytics. Use unique names if a race condition between timings is
     * possible; if a start time with the same names is registerd without an end
     * time in between, the original start time is discarded.
     * @param {string} category Category of timing (e.g. 'Assets load time')
     * @param {string} variable Name of the timing (e.g. 'polymer-ready')
     * @param {number} timeStart A timestamp associated with start, in ms.
     */
    Analytics.prototype.timeStart = function (category, variable, timeStart) {
      var categoryTimes = this.startTimes_[category] || (this.startTimes_[category] = {});
      categoryTimes[variable] = timeStart;
    };

    /**
     * Ends a timing event. The difference between the time associated with this
     * event and the timeStart event with the matching category and variable names
     * is sent to analytics. If no match can be found, the time is discarded.
     * @param {string} category Category of timing (e.g. 'Assets load time')
     * @param {string} variable Name of the timing (e.g. 'polymer-ready')
     * @param {number} timeEnd A timestamp associated with end, in ms.
     * @param {string=} opt_label An optional sublabel, for e.g. A/B test identification.
     * @param {number=} opt_maxTime An optional max time, after which '- outliers' will be appended to variable name.
     */
    Analytics.prototype.timeEnd = function (category, variable, timeEnd, opt_label, opt_maxTime) {
      var categoryTimes = this.startTimes_[category];
      if (!categoryTimes) {
        return;
      }
      var timeStart = categoryTimes[variable];
      if (timeStart !== null) {
        this.trackPerf(category, variable, timeEnd - timeStart, opt_label, opt_maxTime);
        categoryTimes[variable] = null;
      }
    };

    /**
     * Adds event listeners to track when the network's online/offline status
     * changes, and updates the tracker with the new status.
     */
    Analytics.prototype.trackOnlineStatus = function () {
      this.updateTracker(this.customDimensions.ONLINE, navigator.onLine);

      var updateOnlineStatus = function (event) {
        this.updateTracker(this.customDimensions.ONLINE, navigator.onLine);
        this.trackEvent('network', 'change', event.type);
      }.bind(this);

      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
    };

    /**
     * Tracks whether service workers are supported in the current browser,
     * as well as whether the current page load is controlled by a service worker.
     */
    Analytics.prototype.trackServiceWorkerControlled = function () {
      var serviceworkerStatus = this.getServiceWorkerStatus();

      this.updateTracker(this.customDimensions.SERVICE_WORKER_STATUS,
        serviceworkerStatus);

      if (serviceworkerStatus === 'unsupported') {
        this.trackEvent('serviceworker', 'supported', false);
      } else {
        this.trackEvent('serviceworker', 'supported', true);
        this.trackEvent('serviceworker', 'controlled',
          serviceworkerStatus === 'controlled');
      }
    };

    /**
     * Gets the status of the service worker for the page.
     * @return {string} Either 'unsupported', 'supported', or 'controlled'.
     */
    Analytics.prototype.getServiceWorkerStatus = function () {
      if ('serviceWorker' in navigator) {
        return navigator.serviceWorker.controller ?
          'controlled' : 'supported';
      }
      return 'unsupported';
    };

    /**
     * Gets the notification permission for the page.
     * @return {string} The current notification permission or 'unsupported'.
     */
    Analytics.prototype.getNotificationPermission = function () {
      return exports.Notification ?
        exports.Notification.permission : 'unsupported';
    };

    return new Analytics();
  })(window);
