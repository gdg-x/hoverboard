/*
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

window.addEventListener('WebComponentsReady', () => {

  // We use Page.js for routing. This is a Micro
  // client-side router inspired by the Express router
  // More info: https://visionmedia.github.io/page.js/

  // Middleware
  function scrollToTop(ctx, next) {
    app.scrollPageToTop();
    next();
  }

  // Routes
  page('/', scrollToTop, () => {
    app.route = 'home';
  });

  page('/users', scrollToTop, () => {
    app.route = 'users';
  });

  page('/users/:name', scrollToTop, data => {
    app.route = 'user-info';
    app.params = data.params;
  });

  page('/contact', scrollToTop, () => {
    app.route = 'contact';
  });

  page('*', function(attempted) {
    let url = window.location.href + attempted.path.substr(1);
    app.$.toastConfirm.text = `Can't find: ${url}. Redirected you to Home Page`;
    app.$.toastConfirm.show();
    page.redirect('/');
  });

  // add #! before urls
  // https://developers.google.com/webmasters/ajax-crawling/docs/learn-more
  page({
    // Disable for Firebase or GAE
    hashbang: false
  });

});
