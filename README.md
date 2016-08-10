# Project Hoverboard 

[![Join the chat at https://gitter.im/gdg-x/hoverboard](https://badges.gitter.im/gdg-x/hoverboard.svg)](https://gitter.im/gdg-x/hoverboard?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Project Hoverboard is the next generation conference website template after [Project Zeppelin](https://github.com/gdg-x/zeppelin) and more optimized version - [Project Zeppelin-Grunt](https://github.com/gdg-x/zeppelin-grunt).

> Template is brought by [Oleh Zasadnyy](https://plus.google.com/+OlehZasadnyy) from [GDG Lviv](http://lviv.gdg.org.ua/).

> *Do you like it?* Show your support - please, **star the project**.

### [Live demo](https://hoverboard.firebaseapp.com/)

This template, along with the `polymer-cli` toolchain, also demonstrates use
of the "PRPL pattern" This pattern allows fast first delivery and interaction with
the content at the initial route requested by the user, along with fast subsequent
navigation by pre-caching the remaining components required by the app and
progressively loading them on-demand as the user navigates through the app.

The PRPL pattern, in a nutshell:

* **Push** components required for the initial route
* **Render** initial route ASAP
* **Pre-cache** components for remaining routes
* **Lazy-load** and progressively upgrade next routes on-demand

### Setup

##### Prerequisites

Install [polymer-cli](https://github.com/Polymer/polymer-cli):

    npm i -g polymer-cli@0.12.0

### Install dependencies

    bower install

### Start the development server

This command serves the app at `http://localhost:8080` and provides basic URL
routing for the app:

    polymer serve


### Build

This command performs HTML, CSS, and JS minification on the application
dependencies, and generates a service-worker.js file with code to pre-cache the
dependencies based on the entrypoint and fragments specified in `polymer.json`.
The minified files are output to the `build/unbundled` folder, and are suitable
for serving from a HTTP/2+Push compatible server.

In addition the command also creates a fallback `build/bundled` folder,
generated using fragment bundling, suitable for serving from non
H2/push-compatible servers or to clients that do not support H2/Push.

    polymer build

### Test the build

This command serves the minified version of the app in an unbundled state, as it would
be served by a push-compatible server:

    polymer serve build/unbundled

This command serves the minified version of the app generated using fragment bundling:

    polymer serve build/bundled

### Extend

You can extend the app by adding more elements that will be demand-loaded
e.g. based on the route, or to progressively render non-critical sections
of the application.  Each new demand-loaded fragment should be added to the
list of `fragments` in the included `polymer.json` file.  This will ensure
those components and their dependencies are added to the list of pre-cached
components (and will have bundles created in the fallback `bundled` build).


## Who uses the template?

Going to use template? Go on! The only thing we ask - let us know at with a pull request, so we can include you to this list.

| [GDG DevFest Ukraine](http://devfest.gdg.org.ua) |
| :------------ |
| [GDG DevFest Sao Paulo](http://sp.devfest.com.br)  |
| [GDG DevFest Hamburg 2015](http://devfest.de)  |
| [GDG DevFest Mezam 2015](https://devfest-mezam.gdgbambili.xyz) |
| [GDG DevFest Silicon Valley 2015](http://devfest2015.gdgsv.com/) |
| [GDG DevFest Belgium 2015](http://devfest.be/) |
| [GDG DevFest South East Nigeria 2015](http://www.devfestse.com) |
| [GDG DevFest Istanbul 2015](https://www.devfesttr.com) |
| [GDG Cáceres CodeWeek 2015](http://codeweek.gdgcaceres.es) |
| [GDG Bingham University Website](http://bhu.gdg.ng) |

## Contributing

Project Hoverboard is still under development and it is open for contributions. Feel free to send PR. If you have any questions, feel free to contact [Oleh Zasadnyy](https://plus.google.com/+OlehZasadnyy).
#### General workflow
1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Make your changes
4. Run the tests, adding new ones for your own code if necessary
5. Commit your changes (`git commit -am 'Added some feature'`)
6. Push to the branch (`git push origin my-new-feature`)
7. Create new Pull Request

## Contributing

Project Hoverboard is still under development and it is open for contributions. Feel free to send PR. If you have any questions, feel free to contact [Oleh Zasadnyy](https://plus.google.com/+OlehZasadnyy).
#### General workflow
1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Make your changes
4. Run the tests, adding new ones for your own code if necessary
5. Commit your changes (`git commit -am 'Added some feature'`)
6. Push to the branch (`git push origin my-new-feature`)
7. Create new Pull Request


### Contributors
See [list of contributors](https://github.com/gdg-x/hoverboard/graphs/contributors)

Maintainer: [@ozasadnyy](https://github.com/ozasadnyy).

######The GDG App, GDG[x] are not endorsed and/or supported by Google, the corporation.

## License

Project is published under the [MIT license](https://github.com/gdg-x/hoverboard/blob/master/LICENSE.md) Feel free to clone and modify repo as you want, but don't forget to add reference to authors :)
