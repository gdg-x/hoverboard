![Start Polymer](https://avatars0.githubusercontent.com/u/10231285?v=3&s=200)

# Polymer Starter Kit Plus

[![sitespeed.io 99%](https://img.shields.io/badge/sitespeed.io-99%-brightgreen.svg)](https://results.sitespeed.io/6ba4-2016/1/21/96a731d4-45fe-4230-958f-255011dd14a3/index2.html)
[![PageSpeed 97%](https://img.shields.io/badge/PageSpeed-97%-brightgreen.svg)](https://developers.google.com/speed/pagespeed/insights/?url=https%3A%2F%2Fpolymer-starter-kit-plus.appspot.com&tab=desktop)
[![Resizer Responsive UI](https://img.shields.io/badge/Resizer-Responsive%20UI-brightgreen.svg)](http://design.google.com/resizer/#url=https%3A%2F%2Fpolymer-starter-kit-plus.appspot.com)
[![bitHound Code](https://www.bithound.io/github/StartPolymer/polymer-starter-kit-plus/badges/code.svg)](https://www.bithound.io/github/StartPolymer/polymer-starter-kit-plus)
[![Google+ Start Polymer](https://img.shields.io/badge/Google+-Start%20Polymer-dd4b39.svg)](https://plus.google.com/101148544618948882647)

> A starting point for building [Single-Page Applications](https://en.wikipedia.org/wiki/Single-page_application) with Polymer 1.x

> App template for building [Static Web Applications](http://www.staticapps.org) deployable to static hosting or CDN without dependencies on any backend - [Static app use case](https://divshot.com/blog/guest/how-static-apps-are-changing-startups/)

> Polymer Starter Kit Plus is keeping up to date with
[Polymer Starter Kit](https://github.com/PolymerElements/polymer-starter-kit) and following  
[The 10 Commandments of Modern Web Application](https://gist.github.com/JosefJezek/8020bd8f02c4992e7d7d)

## Demo

See latest Polymer Starter Kit Plus Demo (from master) at https://polymer-starter-kit-plus.appspot.com

The demo is running on Google App Engine with [HTTP 2.0 Push](https://github.com/GoogleChrome/http2push-gae)

## :sparkles: Features :sparkles:

- Progressive Web App template
 - [Building Progressive Web Apps with Polymer](https://www.youtube.com/watch?v=g7f1Az5fxgU&index=10&list=PLNYkxOF6rcICcHeQY02XLvoGL34rZFWZn)
 - [Getting started with Progressive Web Apps](http://addyosmani.com/blog/getting-started-with-progressive-web-apps/)
- [Polymer](http://polymer-project.org), [Paper](https://elements.polymer-project.org/browse?package=paper-elements), [Iron](https://elements.polymer-project.org/browse?package=iron-elements), [Neon](https://elements.polymer-project.org/browse?package=neon-elements) and
[Start](https://github.com/StartPolymer/start-elements) elements
- Offline setup through [Platinum](https://elements.polymer-project.org/browse?package=platinum-elements) - [Service Worker](http://www.html5rocks.com/en/tutorials/service-worker/introduction/) elements
- Themes directory with [Default Theme](https://github.com/StartPolymer/polymer-starter-kit-plus/blob/master/app/themes/default-theme)
- Default Theme following [SUIT CSS](https://suitcss.github.io) - styling methodology for component-based UI development
 - [Material Design Style](https://www.google.com/design/spec/style/color.html)
 - [Custom Fonts list](https://github.com/StartPolymer/polymer-starter-kit-plus/blob/master/app/themes/default-theme/fonts.list)
 for download fonts from [Google Fonts](https://www.google.com/fonts)
 - [Custom Icons element](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/app/themes/default-theme/icons.html) for [Material Design Icons](https://materialdesignicons.com)
 - [CSS Variables](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/app/themes/default-theme/variables.css) including [Material Design Colors](https://www.google.com/design/spec/style/color.html) - [Material Palette](https://www.materialpalette.com)
 - [JS Variables](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/app/themes/default-theme/variables.js) for colors in index.html and manifest.json
 - Light and Dark background mode following Material Design
 - Support more themes is ideal for [A/B testing](https://en.wikipedia.org/wiki/A/B_testing)
- [Material Design Layout](http://www.google.com/design/spec/layout/principles.html)
- [PostCSS](https://github.com/postcss/postcss) for transforming styles with JS plugins
 - [Introduction to PostCSS](http://www.smashingmagazine.com/2015/12/introduction-to-postcss/)
 - [PostCSS is 2 times faster](https://github.com/postcss/benchmark) than [libsass](https://github.com/sass/libsass), which is written in C++
 - [Autoprefixer](https://github.com/postcss/autoprefixer) add vendor prefixes to CSS rules using values from [Can I Use](http://caniuse.com)
 - [CSS Custom Media Queries](https://github.com/postcss/postcss-custom-media)
 - [CSS Nesting](https://github.com/jonathantneal/postcss-nesting)
 - [CSS MQPacker](https://github.com/hail2u/node-css-mqpacker) - pack same CSS media query rules into one media query rule
 - [Import](https://github.com/postcss/postcss-import) - transform `@import` rules by inlining content
 - [Simple Variables](https://github.com/postcss/postcss-simple-vars) - Sass-like variables
 - [Stylelint](https://github.com/stylelint/stylelint) - modern CSS linter
 - [SUIT CSS linter](https://github.com/postcss/postcss-bem-linter)
- [Babel](https://babeljs.io) for support [ES2015 JavaScript](https://babeljs.io/docs/learn-es2015/)
 - [Polymer elements using the ES2015 class syntax](http://www.code-labs.io/codelabs/polymer-es2015/index.html#3)
- [Nunjucks](https://mozilla.github.io/nunjucks/) templating engine for building static code using Gulp
 - [Metadata](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/app/metadata.js) at one place
 - [Markdown](http://commonmark.org) for [static content](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/app/content)
- Routing with [Page.js](https://visionmedia.github.io/page.js/)
- [Config file](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/config.js)
- [Gulp tasks](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/tasks) per file
- [PageSpeed Insights](https://developers.google.com/speed/docs/insights/about) for performance tuning
- Built-in preview server with [BrowserSync](http://www.browsersync.io)
- [Vulcanize](https://github.com/Polymer/vulcanize) with [Crisper](https://github.com/PolymerLabs/crisper) for [Content Security Policy](https://developer.chrome.com/apps/contentSecurityPolicy) compliance
- Unit testing with [Web Component Tester](https://github.com/Polymer/web-component-tester)
- [Google Analytics](http://www.google.com/analytics/) with [offline support](https://elements.polymer-project.org/elements/platinum-sw?active=platinum-sw-offline-analytics)
- Quick deploy with 3 environments: Development, Staging, Production
 - [Revision](https://github.com/smysnk/gulp-rev-all)
all files by appending content hash to their names
 - Hosting platforms:
    - [Firebase](https://www.firebase.com)
    - [Google App Engine](https://cloud.google.com/appengine/) with [HTTP 2.0 Push](https://github.com/GoogleChrome/http2push-gae#pushing-content-from-a-static-handler)
    - [Google Cloud Storage](https://cloud.google.com/storage/)
    - Any Linux hosting with [SSH](https://en.wikipedia.org/wiki/Secure_Shell)
- [Recipes](/docs/README.md/) for Polymer performance, Mobile Chrome Apps and using Chrome Dev Editor

## Getting Started

To take advantage of Polymer Starter Kit Plus you need to:

1. [Get a copy of the code.](https://github.com/StartPolymer/polymer-starter-kit-plus#1-get-the-code)
2. [Install the dependencies if you don't already have them.](https://github.com/StartPolymer/polymer-starter-kit-plus#2-install-dependencies)
3. [Modify the application to your liking.](https://github.com/StartPolymer/polymer-starter-kit-plus#3-development-workflow)
4. [Deploy your production code.](https://github.com/StartPolymer/polymer-starter-kit-plus#4-deploy-app-tada)

### 1. Get the code

Polymer Starter Kit Plus comes in two flavours - Lite (branch `lite`) and Full (branch `master`). [Lite version](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/lite) doesn't contain demo content!

[Download](https://github.com/StartPolymer/polymer-starter-kit-plus/releases/latest) and extract Polymer Starter Kit Plus to where you want to work.

OR Install [Start Polymer Generator](https://github.com/StartPolymer/generator-startpolymer#installation) and run `yo startpolymer` in `my-project` directory.

:warning: **Important**: Polymer Starter Kit Plus contain dotfiles (files starting with a `.`). If you're copying the contents of the Starter Kit to a new location make sure you bring along these dotfiles as well! On Mac, [enable showing hidden files](http://ianlunn.co.uk/articles/quickly-showhide-hidden-files-mac-os-x-mavericks/), then try extracting/copying Polymer Starter Kit Plus again. This time the dotfiles needed should be visible so you can copy them over without issues.

Rob Dodson has a fantastic [PolyCast video](https://www.youtube.com/watch?v=xz-yixRxZN8) available that walks through using Polymer Starter Kit. An [end-to-end with Polymer](https://www.youtube.com/watch?v=1f_Tj_JnStA) and Polymer Starter Kit talk is also available.

#### Updating from previous version

If you've previously downloaded a copy of the full Starter Kit and would like to update to the latest version, here's a git workflow for doing so:

```sh
git init
git checkout -b master
git add .
git commit -m 'Check-in 1.0.1'
git remote add upstream https://github.com/StartPolymer/polymer-starter-kit-plus.git
git fetch upstream
git merge upstream/master # OR git merge upstream/lite
# resolve the merge conflicts in your editor
git add . -u
git commit -m 'Updated to 1.0.2'
```

### 2. Install dependencies

#### Quick-start (for experienced users)

With Node.js installed, run the following one liner from the root of your Polymer Starter Kit Plus download:

```sh
npm run install:complete # Alias for "sudo npm install -g npm && sudo npm install -g bower gulp && npm install && bower install"

gulp init # Initialize your app - download fonts from Google Fonts and analytics.js
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

The version should be at or above 5.x. [Installing Node.js via package manager](https://nodejs.org/en/download/package-manager/)

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

If you get a browser console error indicating that an element you know you have installed is missing, try deleting the bower_components folder, then run `bower cache clean` followed by `bower install` to reinstall. This can be especially helpful when upgrading from a prior version of the Polymer Starter Kit Plus. 

If the issue is to do with a failure somewhere else, you might find that due to a network issue
a dependency failed to correctly install. We recommend running `npm cache clean` and deleting the `node_modules` directory followed by
`npm install` to see if this corrects the problem. If not, please check the [issue tracker](https://github.com/StartPolymer/polymer-starter-kit-plus/issues) in case
there is a workaround or fix already posted.

### 3. Development workflow

#### Check out the variables

- Gulp variables -  [config.js](https://github.com/StartPolymer/polymer-starter-kit-plus/blob/master/config.js)
- Theme variables -  [variables.css](https://github.com/StartPolymer/polymer-starter-kit-plus/blob/master/app/themes/default-theme/variables.css) and [variables.js](https://github.com/StartPolymer/polymer-starter-kit-plus/blob/master/app/themes/default-theme/variables.js)
- HTML metadata -  [metadata.js](https://github.com/StartPolymer/polymer-starter-kit-plus/blob/master/app/metadata.js)

#### Initialize your app

```sh
gulp init
```

Init task run [download:analytics task](https://github.com/StartPolymer/polymer-starter-kit-plus#download-newest-script-analyticsjs)
and [download:fonts task](https://github.com/StartPolymer/polymer-starter-kit-plus#download-google-fonts)

#### Serve / watch

```sh
gulp serve
```

This outputs an IP address you can use to locally test and another that can be used on devices connected to your network.

#### Build and serve the output from the dist build

```sh
gulp serve:dist
gulp serve:gae
```

#### Run tests

```sh
gulp test:local
```

This runs the unit tests defined in the `app/test` directory through [web-component-tester](https://github.com/Polymer/web-component-tester).

To run tests Java 7 or higher is required. To update Java go to http://www.oracle.com/technetwork/java/javase/downloads/index.html and download ***JDK*** and install it.

#### Build & Vulcanize

```sh
gulp
```

Build and optimize the current project, ready for deployment. This includes vulcanization, image, script, stylesheet and HTML optimization and minification.

### 4. Deploy app :tada:

- For GAE or GCS [install Google Cloud SDK](https://developers.google.com/cloud/sdk/#Quick_Start)
- For Firebase [install Firebase command line tools](https://www.firebase.com/docs/hosting/command-line-tool.html)
- Setup hosting in [config file](https://github.com/StartPolymer/polymer-starter-kit-plus/tree/master/config.js)

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

### Download newest script analytics.js

You need download newest script analytics.js from Google, because link https://www.google-analytics.com/analytics.js has set only 2 hours cache.
Here is [analytics.js changelog](https://developers.google.com/analytics/devguides/collection/analyticsjs/changelog).
Local copy of this script is for better load page performance.

```sh
gulp download:analytics
```

### Download Google Fonts

Download Google Fonts for load page performance and offline using.
Fonts list for download is in file [fonts.list](https://github.com/StartPolymer/polymer-starter-kit-plus/blob/master/fonts.list).

```sh
gulp download:fonts
```

### PageSpeed Insights

```sh
gulp pagespeed
```

### Update versions of dependencies to the latest versions

```sh
# Install tool
npm install -g npm-check-updates

# Check latest versions
npm run check:ver # Alias for "ncu && ncu -m bower"

# Update to the latest versions
npm run update:ver # Alias for "ncu -u && ncu -um bower"
```

## Service Worker

Polymer Starter Kit Plus offers an offline experience thanks to Service Worker and the [Platinum Service Worker elements](https://github.com/PolymerElements/platinum-sw). New to Service Worker? Read the following [introduction](https://github.com/PolymerElements/polymer-starter-kit#service-worker) to understand how it works.

- http://www.html5rocks.com/en/tutorials/service-worker/introduction/
- [chrome://inspect/#service-workers](chrome://inspect/#service-workers)
- [chrome://serviceworker-internals](chrome://serviceworker-internals)

## Unit Testing

Web apps built with Polymer Starter Kit come configured with support for [Web Component Tester](https://github.com/Polymer/web-component-tester) - Polymer's preferred tool for authoring and running unit tests. This makes testing your element based applications a pleasant experience.

[Read more](https://github.com/Polymer/web-component-tester#html-suites) about using Web Component tester.

## Extending

Use a [recipes](https://github.com/yeoman/generator-gulp-webapp/blob/master/docs/recipes/README.md)
or [recipes](https://github.com/gulpjs/gulp/tree/master/docs/recipes)
for integrating other popular technologies like CoffeeScript or Jade.

## Licensing

Like other Google projects, Polymer Starter Kit includes Google license headers at the top of several of our source files. Google's open-source licensing requires that this header be kept in place (sorry!), however we acknowledge that you may need to add your own licensing to files you modify. This can be done by appending your own extensions to these headers.

## Contributing :+1:

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Make your changes
4. Run the tests, adding new ones for your own code if necessary
5. Commit your changes (`git commit -am 'Added some feature'`)
6. Push to the branch (`git push origin my-new-feature`)
7. Create new Pull Request
