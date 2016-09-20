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

HOVERBOARD.Deferred = HOVERBOARD.Deferred || (function () {
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

    return {
      createDeferred: createDeferred
    };
  }());
