# [beta] Project Hoverboard - GDG DevFest 2015 site template

## About
Project Hoverboard is the next generation conference website template after [Project Zeppelin](https://github.com/gdg-x/zeppelin) and more optimized version - [Project Zeppelin-Grunt](https://github.com/gdg-x/zeppelin-grunt).

Template was build using [Polymer](http://polymer-project.org) according to [Material Design](http://www.google.com/design/spec/material-design/introduction.html) guidelines.
The site is **responsive**, **fast** and supports **offline access** (if you are using HTTPS protocol).

Template is brought by [Oleh Zasadnyy](https://plus.google.com/+OlehZasadnyy) from [GDG Lviv](http://lviv.gdg.org.ua/).

*Do you like it?* Show your support - please, **star the project**.

### Live demo [GDG DevFest Ukraine 2015](http://devfest.gdg.org.ua/)

#### The Hoverboard is still under development and can bring breaking changes shortly. If you are looking for stable website template try [Project Zeppelin-Grunt](https://github.com/gdg-x/zeppelin-grunt).

## Features
* Material design
* Polymer
* Responsive
* Integrated speakers and sessions management
* SVG icons
* SEO friendly
* Optimized and fast
* Offline access


## Quick-start guide
1.  [Fork](https://github.com/gdg-x/hoverboard/fork) this repo and clone locally or [download](https://github.com/gdg-x/hoverboard/archive/master.zip) and extract Project Hoverboard to where you want to work.
2.  Install [Node.js](www.nodejs.org).
3.  Run `npm install -g gulp bower && npm install && bower install` from the root of the folder.
4.  Modify template to suit your needs.


#### Requirements

Project dependencies:

- Node.js used to run JavaScript tools from the command line.
- npm, the node package manager, installed with Node.js and used to install Node.js packages.
- gulp, a Node.js-based build tool.
- bower, a Node.js-based package manager used to install front-end packages (like Polymer).

**To install dependencies:**

1)  Check your Node.js version.

```sh
node --version
```

The version should be 0.12.x or above.

2)  If you don't have Node.js installed, or you have a lower version, go to [nodejs.org](https://nodejs.org) and click on the big green Install button.

3)  Install `gulp` and `bower` globally.

```sh
npm install -g gulp bower
```

This lets you run `gulp` and `bower` from the command line.

4)  Install the projects's local `npm` and `bower` dependencies.

```sh
cd hoverboard && npm install && bower install
```

This installs the element sets and tools the hoverboard template requires to build and serve apps.


## Development workflow

#### Serve / watch

```sh
gulp serve
```

This outputs an IP address you can use to locally test and another that can be used on devices connected to your network.

#### Build & Vulcanize

```sh
gulp
```

Build and optimize the current project, ready for deployment. This includes linking as well as vulcanization, image, script, stylesheet and HTML optimization and minification.

#### Build, Vulcanize, and Deploy

```sh
gulp deploy
```

**Warning:** don't forget to [edit destination repository](https://github.com/gdg-x/hoverboard/blob/master/gulpfile.js#L205) to deploy the website.

## Next steps in the project
* Use generator to configure the template from files
* Refactor styles
* Schedule page
* Countdown
* Testimonials block
* Venue block

## Application Theming

Polymer 1.0 introduces a shim for CSS custom properties. We take advantage of this in `app/styles/app-theme.html` and `app/styles/tags-color.html` to provide theming for your application. You can also find our presets for Material Design breakpoints in this file.

[Read more](https://www.polymer-project.org/1.0/docs/devguide/styling.html) about CSS custom properties.

_Ok, to be honest, it should be refactored ASAP._

## Dependency Management

Polymer uses [Bower](http://bower.io) for package management. This makes it easy to keep your elements up to date and versioned. For tooling, we use npm to manage Node.js-based dependencies.

## Service Worker

Template offers an offline-first experience thanks to Service Worker and the [Platinum Service Worker elements](https://github.com/PolymerElements/platinum-sw). New to Service Worker? Read the following [introduction](http://www.html5rocks.com/en/tutorials/service-worker/introduction/) to understand how it works.

#### I get an error message about "Only secure origins are allowed"

Service Workers are only available to "secure origins" (HTTPS sites, basically) in line with a policy to prefer secure origins for powerful new features. However http://localhost is also considered a secure origin, so if you can, developing on localhost is an easy way to avoid this error. For production, your site will need to support HTTPS.

#### How do I debug Service Worker?

If you need to debug the event listener wire-up use `chrome://serviceworker-internals`.

#### What are those buttons on chrome://serviceworker-internals?

This page shows your registered workers and provides some basic operations.

* Unregister: Unregisters the worker.
* Start: Starts the worker. This would happen automatically when you navigate to a page in the worker's scope.
* Stop: Stops the worker.
* Sync: Dispatches a 'sync' event to the worker. If you don't handle this event, nothing will happen.
* Push: Dispatches a 'push' event to the worker. If you don't handle this event, nothing will happen.
* Inspect: Opens the worker in the Inspector.

#### Not yet ready for Service Worker support?

If for any reason you decide that Service Worker support isn't for you, you can disable it from your project using these 3 steps:

* Remove 'precache' from the list in the 'default' gulp task ([gulpfile.js](https://github.com/PolymerElements/polymer-starter-kit/blob/master/gulpfile.js))
* Remove the two Platinum Service Worker elements (platinum-sw/..) in [app/elements/elements.html](https://github.com/PolymerElements/polymer-starter-kit/blob/master/app/elements/elements.html)
* Remove references to the platinum-sw elements from your application [index](https://github.com/PolymerElements/polymer-starter-kit/blob/master/app/index.html).

You will also want to navigate to `chrome://serviceworker-internals` and unregister any Service Workers registered by Hoverboard for your app just in case there's a copy of it cached.

## Frequently Asked Questions

> Where do I customize my application theme?

Theming can be achieved using [CSS Custom properties](https://www.polymer-project.org/1.0/docs/devguide/styling.html#xscope-styling-details) via [app/styles/app-theme.html](https://github.com/PolymerElements/polymer-starter-kit/blob/master/app/styles/app-theme.html).
You can also use `app/styles/main.css` for pure CSS stylesheets (e.g for global styles), however, note that Custom properties will not work there under the shim.

A [Polycast](https://www.youtube.com/watch?v=omASiF85JzI) is also available that walks through theming using Polymer 1.0.

> Where do I configure routes in my application?

This can be done via [`app/elements/routing.html`](https://github.com/PolymerElements/polymer-starter-kit/blob/master/app/elements/routing.html). We use Page.js for routing, and new routes
can be defined in this import. We then toggle which `<iron-pages>` page to display based on the [selected](https://github.com/PolymerElements/polymer-starter-kit/blob/master/app/index.html#L105) route.

> Something has failed during installation. How do I fix this?

Our most commonly reported issue is around system permissions for installing Node.js dependencies.
We recommend following the [fixing npm permissions](https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md)
guide to address any messages around administrator permissions being required. If you use `sudo`
to work around these issues, this guide may also be useful for avoiding that.

If you run into an exception that mentions five optional dependencies failing (or an `EEXIST` error), you
may have run into an npm [bug](https://github.com/npm/npm/issues/6309). We recommend updating to npm 2.11.0+
to work around this. You can do this by opening a Command Prompt/terminal and running `npm install npm@2.11.0 -g`. If you are on Windows,
Node.js (and npm) may have been installed into `C:\Program Files\`. Updating npm by running `npm install npm@2.11.0 -g` will install npm
into `%AppData%\npm`, but your system will still use the npm version. You can avoid this by deleting your older npm from `C:\Program Files\nodejs`
as described [here](https://github.com/npm/npm/issues/6309#issuecomment-67549380).

If the issue is to do with a failure somewhere else, you might find that due to a network issue
a dependency failed to install correctly. We recommend running `npm cache clean` and deleting the `node_modules` directory followed by
`npm install` to see if this corrects the problem. If not, please check the [issue tracker](https://github.com/PolymerElements/polymer-starter-kit/issues) in case
there is a workaround or fix already posted.


> I'm having trouble getting Vulcanize to build my project on Windows fully. Help?

Some Windows users have run into trouble with the `elements.vulcanized.html` file in their `dist` folder
not being correctly vulcanized. This can happen if your project is in a folder with a name containing a
space. You can work around this issue by ensuring your path doesn't contain one.

There is also an [in-flight](https://github.com/PolymerElements/polymer-starter-kit/issues/62#issuecomment-108974016) issue
where some are finding they need to disable the `inlineCss` option in our configuration for Vulcanize
to build correctly. We are still investigating this, however for the time-being use the workaround if
you find your builds getting stuck here.


> How do I add new JavaScript files to Hoverboard so they're picked up by the build process?

At the bottom of `app/index.html`, you will find a building block that can be used to include additional
scripts for your app. Build blocks are just normal script tags that are wrapped in an HTML
comment that indicates where to concatenate and minify their final contents to.

Below, we've added in `script2.js` and `script3.js` to this block. The line
`<!-- build:js scripts/app.js -->` specifies that these scripts will be squashed into `scripts/app.js`
during a build.

```html
<!-- build:js scripts/app.js -->
<script src="scripts/app.js"></script>
<script src="scripts/script2.js"></script>
<script src="scripts/script3.js"></script>
<!-- endbuild-->
```

## Who is using template?

Going to use template? Go on! The only thing we ask - let us know at [lviv@gdg.org.ua](mailto:lviv@gdg.org.ua) so we can include you to this list, or make a pull request.

## Contributing

Project Hoverboard is still under development and it is open for contributions. Feel free to send PR. If you have any questions, feel free to contact [Oleh Zasadnyy](https://plus.google.com/+OlehZasadnyy).

## License

Project is published under the [MIT license](https://github.com/gdg-x/hoverboard/blob/master/LICENSE.md) Feel free to clone and modify repo as you want, but don't forget to add reference to authors :)
