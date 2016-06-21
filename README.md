# Project Hoverboard - GDG DevFest 2016 site template

> Project Hoverboard is the next generation conference website template after [Project Zeppelin](https://github.com/gdg-x/zeppelin) and more optimized version - [Project Zeppelin-Grunt](https://github.com/gdg-x/zeppelin-grunt).

> Template was build using [Polymer](http://polymer-project.org) according to [Material Design](http://www.google.com/design/spec/material-design/introduction.html) guidelines and based on [Polymer Starter Kit Plus](https://github.com/StartPolymer/polymer-starter-kit-plus).
> The site is **responsive**, **fast** and supports **offline access** (if you are using HTTPS protocol).

> Template is brought by [Oleh Zasadnyy](https://plus.google.com/+OlehZasadnyy) from [GDG Lviv](http://lviv.gdg.org.ua/).

> *Do you like it?* Show your support - please, **star the project**.

### [Live demo](https://hoverboard.firebaseapp.com/)


## Features
* Material design
* Polymer
* Offline access
* Responsive
* Animations
* Integrated speakers and sessions management
* SVG icons
* SEO friendly
* Optimized and fast
* Editable theme colors
* ES2015 (compiles with Babel)
* Quick deploy


## Quick-start guide
*  [Fork](https://github.com/gdg-x/hoverboard/fork) this repo and clone locally or [download](https://github.com/gdg-x/hoverboard/archive/master.zip) and extract Project Hoverboard to where you want to work.
*  With Node.js installed, run the following one liner from the root of your Hoverboard download:

```sh
npm run install:complete # Alias for "sudo npm install -g npm && sudo npm install -g bower gulp && npm install && bower install"
    
gulp init # Initialize your app - download fonts from Google Fonts and analytics.js
```

*  [Modify template to suit your needs.](https://github.com/gdg-x/hoverboard#modify-to-suit-your-needs) 


### Requirements
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


### Modify to suit your needs
* Event info - [metadata folder](https://github.com/gdg-x/hoverboard/tree/master/app/metadata)
* Theme colors - [variables.css](https://github.com/gdg-x/hoverboard/tree/master/app/themes/hoverboard-theme/variables.css)
* Deployment [configs](https://github.com/gdg-x/hoverboard/tree/master/config.js)


### Development workflow
#### Initialize your app

```sh
gulp init
```

Init task run [download:analytics task](https://github.com/gdg-x/hoverboard#download-newest-script-analyticsjs)
and [download:fonts task](https://github.com/gdg-x/hoverboard#download-google-fonts)

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


### Deploy app

- For GAE or GCS [install Google Cloud SDK](https://developers.google.com/cloud/sdk/#Quick_Start)
- For Firebase [install Firebase command line tools](https://www.firebase.com/docs/hosting/command-line-tool.html)
- Setup hosting in [config file](https://github.com/gdg-x/hoverboard/tree/master/config.js)

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


### Tools

#### Download newest script analytics.js

You need download newest script analytics.js from Google, because link https://www.google-analytics.com/analytics.js has set only 2 hours cache.
Here is [analytics.js changelog](https://developers.google.com/analytics/devguides/collection/analyticsjs/changelog).
Local copy of this script is for better load page performance.

```sh
gulp download:analytics
```

#### Download Google Fonts

Download Google Fonts for load page performance and offline using.
Fonts list for download is in file [fonts.list](https://github.com/gdg-x/hoverboard/blob/master/fonts.list).

```sh
gulp download:fonts
```

#### PageSpeed Insights

```sh
gulp pagespeed
```

#### Update versions of dependencies to the latest versions

```sh
# Install tool
npm install -g npm-check-updates

# Check latest versions
npm run check:ver # Alias for "ncu && ncu -m bower"

# Update to the latest versions
npm run update:ver # Alias for "ncu -u && ncu -um bower"
```

## Who is using template?

Going to use template? Go on! The only thing we ask - let us know at [lviv@gdg.org.ua](mailto:lviv@gdg.org.ua) so we can include you to this list, or make a pull request.

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


## Roadmap
* Deploy to GitHub pages
* Implement Progressive Web App template
* Better ES2015 support
* Contact page
* My schedule
* Push notification


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
