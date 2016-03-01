/*
@license
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

/* global page */

// We use Page.js for routing. This is a Micro
// client-side router inspired by the Express router
// More info: https://visionmedia.github.io/page.js/

// Sets app default base URL
let baseUrl = '/';

if (window.location.port === '') {  // if production
  // Uncomment baseURL below and
  // set baseURL to '/your-pathname/' if running from folder in production
  // baseUrl = '/polymer-starter-kit-plus/';

  // Removes end / from baseUrl which page.base requires for production
  page.base(baseUrl.replace(/\/$/, ''));
}

var app = document.getElementById('app');

window.addEventListener('upgraded', () => {
  app.baseUrl = baseUrl;
});

// Utility function to listen to an event on a node once.
function once(node, event, fn, args) {
  var self = this;
  var listener = function() {
    fn.apply(self, args);
    node.removeEventListener(event, listener, false);
  };
  node.addEventListener(event, listener, false);
}

function closeDrawer(ctx, next) {
  function setData() {
    app.closeDrawer();
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
  next();
}

// Routes
page('*', closeDrawer, (ctx, next) => {
  next();
});

function setHomePage() {
  function setData() {
    app.route = 'home';
    app.scrollPageToTop();
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
}

page('/', () => {
  setHomePage();
});

page(baseUrl, () => {
  setHomePage();
});

page('/blog', () => {
  function setData() {
    app.route = 'blog';
    app.scrollPageToTop();
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
});

page('/blog/:id', ctx => {
  function setData() {
    app.route = 'post';
    app.params = ctx.params;
    app.scrollPageToTop();
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
});

page('/speakers', () => {
  function setData() {
    app.route = 'speakers';
    app.scrollPageToTop();
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
});

page('/speakers/:id', ctx => {
  function setData() {
    app.route = 'speakers';
    app.params = ctx.params;
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
});

page('/schedule', () => {
  function setData() {
    app.route = 'schedule';
    app.scrollPageToTop();
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
});

page('/schedule/:id', ctx => {
  function setData() {
    app.route = 'schedule';
    app.params = ctx.params;
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
});

// 404
page('*', ctx => {
  function setData() {
    page.redirect(baseUrl);
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
});

page({
  // add #! before urls
  // https://developers.google.com/webmasters/ajax-crawling/docs/learn-more
  // Disable for Firebase or GAE
  hashbang: false
});
