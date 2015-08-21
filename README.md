![Start Polymer](https://avatars0.githubusercontent.com/u/10231285?v=3&s=200)

# Polymer Starter Kit Plus

[![PageSpeed:100/100](https://img.shields.io/badge/PageSpeed-100%20/%20100-brightgreen.svg)](https://developers.google.com/speed/pagespeed/insights/?url=https%3A%2F%2Fpolymer-starter-kit-plus.firebaseapp.com)
[![bitHound Score](https://www.bithound.io/github/StartPolymer/polymer-starter-kit-plus/badges/score.svg)](https://www.bithound.io/github/StartPolymer/polymer-starter-kit-plus)

> A starting point for building web applications with Polymer 1.x

> Polymer Starter Kit Plus is keeping up to date with [Polymer Starter Kit](https://github.com/PolymerElements/polymer-starter-kit)

:sparkles: [DEMO](https://polymer-starter-kit-plus.firebaseapp.com) :sparkles:

## Features

- [Polymer](http://polymer-project.org), [Paper](https://elements.polymer-project.org/browse?package=paper-elements), [Iron](https://elements.polymer-project.org/browse?package=iron-elements) and [Neon](https://elements.polymer-project.org/browse?package=neon-elements) elements
- [Material Design](http://www.google.com/design/spec/material-design/introduction.html) layout
- Routing with [Page.js](https://visionmedia.github.io/page.js/)
- Offline setup through [Platinum](https://elements.polymer-project.org/browse?package=platinum-elements) Service Worker elements
- [Config file](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/config.js)
- [Custom icons element](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/app/elements/custom-icons/icons.html)
- [Gulp tasks](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/gulp-tasks) per file
- [Autoprefixer](https://github.com/postcss/autoprefixer) for CSS
- [PageSpeed Insights](https://developers.google.com/speed/docs/insights/about) for performance tuning
- Built-in preview server with [BrowserSync](http://www.browsersync.io)
- [Vulcanize](https://github.com/Polymer/vulcanize) with [Content Security Policy CSP](https://github.com/PolymerLabs/crisper)
- Unit testing with [Web Component Tester](https://github.com/Polymer/web-component-tester)
- [Google Analytics](http://www.google.com/analytics/) with [offline support](https://elements.polymer-project.org/elements/platinum-sw?active=platinum-sw-offline-analytics)
- Quick deploy with 3 environments: Development, Staging, Production
 - [Revision](https://github.com/smysnk/gulp-rev-all)
all files by appending content hash to their names
 - Hosting platforms:
   - [Firebase](https://www.firebase.com)
   - [Google Cloud Storage](https://cloud.google.com/storage/)

## Getting Started

To take advantage of Polymer Starter Kit Plus you need to:

1. Get a copy of the code.
2. Install the dependencies if you don't already have them.
3. Modify the application to your liking.
4. Deploy your production code.

### 1. Get the code

[Download](https://github.com/StartPolymer/polymer-starter-kit-plus/releases/latest) and extract Polymer Starter Kit Plus to where you want to work.

Or `git clone https://github.com/StartPolymer/polymer-starter-kit-plus.git <my-repo-name>`

#### Updating from previous version

If you've previously downloaded a copy of the full Starter Kit and would like to update to the latest version, here's a git workflow for doing so:

```sh
git init
git checkout -b master
git add .
git commit -m 'Check-in 1.0.1'
git remote add upstream https://github.com/StartPolymer/polymer-starter-kit-plus.git
git fetch upstream
git merge upstream/master
# resolve the merge conflicts in your editor
git add . -u
git commit -m 'Updated to 1.0.2'
```

### 2. Install dependencies

#### Quick-start (for experienced users)

With Node.js installed, run the following one liner from the root of your Polymer Starter Kit Plus download:

```sh
npm run-script install-all
```

#### Prerequisites (for everyone)

The full starter kit requires the following major dependencies:

- Node.js, used to run JavaScript tools from the command line.
- npm, the node package manager, installed with Node.js and used to install Node.js packages.
- gulp, a Node.js-based build tool.
- bower, a Node.js-based package manager used to install front-end packages (like Polymer).

**To install dependencies:**

1)  Check your Node.js version.

```sh
node --version
```

The version should be at or above 0.12.x. [Installing Node.js via package manager](https://github.com/joyent/node/wiki/installing-node.js-via-package-manager)

2)  If you don't have Node.js installed, or you have a lower version, go to [nodejs.org](https://nodejs.org) and click on the big green Install button.

3)  Install `gulp` and `bower` globally.

```sh
npm install -g gulp bower
```

This lets you run `gulp` and `bower` from the command line.

4)  Install the starter kit's local `npm` and `bower` dependencies.

```sh
cd polymer-starter-kit-plus && npm install && bower install
```

This installs the element sets (Paper, Iron, Platinum) and tools the starter kit requires to build and serve apps.

### 3. Development workflow

#### Check out the config.js

Gulp variables are in the file [config.js](https://github.com/StartPolymer/polymer-starter-kit-plus/blob/master/config.js)

#### Serve / watch

```sh
gulp serve
```

This outputs an IP address you can use to locally test and another that can be used on devices connected to your network.

#### Build and serve the output from the dist build

```sh
gulp serve:dist
```

#### Run tests

```sh
gulp test:local
```

This runs the unit tests defined in the `app/test` directory through [web-component-tester](https://github.com/Polymer/web-component-tester).

#### Build & Vulcanize

```sh
gulp
```

Build and optimize the current project, ready for deployment. This includes linting as well as vulcanization, image, script, stylesheet and HTML optimization and minification.

### 4. Deploy code :tada:

#### Deploy to development environment

```sh
gulp deploy:dev
```

#### Deploy to staging environment

```sh
gulp deploy:stag
```

#### Deploy to production environment

```sh
gulp deploy:prod
```

#### Promote the staging version to the production environment

```sh
gulp deploy:promote
```

## Tools

### PageSpeed Insights

```sh
gulp pagespeed
```

## Service Worker

Polymer Starter Kit Plus offers an offline experience thanks to Service Worker and the [Platinum Service Worker elements](https://github.com/PolymerElements/platinum-sw). New to Service Worker? Read the following [introduction](https://github.com/PolymerElements/polymer-starter-kit#service-worker) to understand how it works.

## Unit Testing

Web apps built with Polymer Starter Kit come configured with support for [Web Component Tester](https://github.com/Polymer/web-component-tester) - Polymer's preferred tool for authoring and running unit tests. This makes testing your element based applications a pleasant experience.

[Read more](https://github.com/Polymer/web-component-tester#html-suites) about using Web Component tester.

## Extending

Use a [recipes](https://github.com/yeoman/generator-gulp-webapp/blob/master/docs/recipes/README.md)
or [recipes](https://github.com/gulpjs/gulp/tree/master/docs/recipes)
for integrating other popular technologies like CoffeeScript or Jade.

## Contributing :+1:

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Make your changes
4. Run the tests, adding new ones for your own code if necessary
5. Commit your changes (`git commit -am 'Added some feature'`)
6. Push to the branch (`git push origin my-new-feature`)
7. Create new Pull Request
