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

let app = document.getElementById('app');

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

// Middleware
function scrollToTop(ctx, next) {
  function setData() {
    app.scrollPageToTop();
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
  next();
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

function setFocus(selected){
  document.querySelector('section[data-route="' + selected + '"]').focus();
}

// Routes
page('*', scrollToTop, closeDrawer, (ctx, next) => {
  next();
});

function setHomePage() {
  function setData() {
    app.route = 'home';
    app.pageTitle = 'Polymer';
    app.pageSubTitle = 'The future of the web today';
    setFocus(app.route);
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

page('/users', () => {
  function setData() {
    app.route = 'users';
    app.pageTitle = 'Users';
    app.pageSubTitle = 'This is the users section';
    setFocus(app.route);
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
});

page('/users/:name', ctx => {
  function setData() {
    app.route = 'user-info';
    app.pageTitle = 'User information';
    app.pageSubTitle = 'This is the users section';
    app.params = ctx.params;
    setFocus(app.route);
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
});

page('/contact', () => {
  function setData() {
    app.route = 'contact';
    app.pageTitle = 'Contact';
    app.pageSubTitle = 'This is the contact section';
    setFocus(app.route);
  }

  // Check if element prototype has not been upgraded yet
  if (!app.upgraded) {
    once(app, 'upgraded', setData);
  } else {
    setData();
  }
});

page('/settings', () => {
  function setData() {
    app.route = 'settings';
    app.pageTitle = 'Settings';
    app.pageSubTitle = 'Edit your settings';
    setFocus(app.route);
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
    let url = ctx.path.substr(1);
    app.$.confirmToast.text = `Can't find: ${url}. Redirected you to Home Page`;
    app.$.confirmToast.show();
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
