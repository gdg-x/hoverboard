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

HOVERBOARD.ServiceWorkerRegistration = (function () {
  'use strict';

  // Ensure we only attempt to register the SW once.
  var isAlreadyRegistered = false;

  var URL = 'service-worker.js';
  var SCOPE = './';

  var register = function () {
    if (!isAlreadyRegistered) {
      isAlreadyRegistered = true;

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(URL, {
          scope: SCOPE
        }).then(function (registration) {
        }).catch(function (e) {
          HOVERBOARD.Analytics.trackError('navigator.serviceWorker.register() error', e);
          console.error('Service worker registration failed:', e);
        });
      }
    }
  };

  return {
    register: register,
    URL: URL,
    SCOPE: SCOPE
  };
})();
