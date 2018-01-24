# Set up

Follow the instructions below to install, build, and run the
Project Hoverboard locally in less than 15 minutes.

Or you may use [Docker container for development](docker.md)

## Install the Hoverboard and dependencies

1.  Install [Node.js](https://nodejs.org/) (`node`) version 8 or above.
    Node.js includes Node Package Manager (`npm`) by default. The Hoverboard
    uses `npm` for Polymer CLI.

1.  Verify that you're running `node` version 8.1 or above and `npm`
    version 5.0.3 or above.

        node -v
        v8.1.0

        npm -v
        5.0.3

1.  [Fork](https://github.com/gdg-x/hoverboard/fork) this repository

1.  Clone it locally.

1. `cd` into the base directory of your Hoverboard project.

1.  Install the application dependencies.

        npm install

## Directory structure

The diagram below is a brief summary of the directories within the PSK.

    /
    |---bower_components/
    |---build/
    |---data/
    |---docs/
    |---images/
    |---scripts/
    |---src/
    |   |---behaviors/
    |   |---effects/
    |   |---elements/
    |   |---js-wrappers/
    |   |---pages/
    |   |---styles/
    |

*   `bower_components/` is the place for project dependencies.
*   `build/` is the directory to deploy to production.
*   `data/` folder with all data for the template including config, blog, 
    partners, schedule, sessions, speakers, team and videos.
*   `docs/` contains optional "recipes" (how-to guides) for adding features
    to your application or for using optional tools or editors.
*   `images/` is for static images.
*   `scripts/` is the place for JS scripts.
*   `src/` is where you store all of your source code and do all of your
    development.
*   `behaviors/` folder for custom [behaviors][behaviors].
*   `effects/` is where you keep your effects for instance [scroll-effects][scroll-effects].
*   `elements/` is where you keep your custom elements.
*   `js-wrappers/` is where you keep your custom elements.
*   `pages/` is where you keep your pages' description.
*   `styles/` houses your app's [shared styles][shared styles] and CSS rules.


## Build and serve

The Hoverboard is ready to be built and ran locally.

1. `cd` into the base directory of your Hoverboard project.

1.  Serve the app locally.

        npm run serve

1.  Build the app.

        npm run build


## Next steps

Now that your Hoverboard is up and running, learn how to [configure 
app](configure-app.md) for your needs, or how to [deploy the app to the
web](deploy.md).

[shared styles]: https://www.polymer-project.org/1.0/docs/devguide/styling.html#style-modules
[behaviors]: https://www.polymer-project.org/1.0/docs/devguide/behaviors
[polymer-cli]: https://github.com/Polymer/polymer-cli 
[scroll-effects]: https://elements.polymer-project.org/elements/app-layout?active=Polymer.AppScrollEffectsBehavior
