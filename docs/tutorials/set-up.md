# Set up

Follow the instructions below to install, build, and run the
Project Hoverboard locally in less than 15 minutes.

Or you may use [Docker container for development](docker.md)

## Install the Hoverboard and dependencies

1. [Fork repository](https://github.com/gdg-x/hoverboard/fork) and clone it locally
1. Setup Environment
   * Install [Node.js (v8.9.4 or above)](https://nodejs.org/en/download/)
   * Install Firebase CLI: `npm i -g firebase-tools` or `yarn global add firebase-tools`
1. Create [Firebase account](https://console.firebase.google.com) and login into [Firebase CLI](https://firebase.google.com/docs/cli/): `firebase login`
1. Update [Hoverboard config](/config) and [Resources](/data). More info can be found [here](./configure-app.md)
1. Import initial data to the Firebase Database
    * Generate `serviceAccount.json` file (go to https://console.firebase.google.com/project/%YOUR_PROJECT_ID%/settings/serviceaccounts/adminsdk)
      - Go to https://console.firebase.google.com/project/%YOUR_PROJECT_ID%/settings/serviceaccounts/adminsdk
      - Ensure that **Node.js** is selected and press **GENERATE NEW PRIVATE KEY**
      - Save the file as `serviceAccount.json` and to the root of your hoverboard directory (❗Do NOT commit this file to the public repository)
    * [Optional] You can edit `docs/default-firebase-data.json)` file using your own data
    * Run `npm install` or `yarn`
    * Run `npm run firestore:init` or `yarn firestore:init`


## Directory structure

The diagram below is a brief summary of the directories within the project.

    /
    |---.temp/
    |---appengine/
    |---bower_components/
    |---build/
    |---config/
    |---data/
    |---docs/
    |---functions/
    |---gulp-tasks/
    |---images/
    |---internals/
    |---node_modules/
    |---scripts/
    |---src/
    |   |---effects/
    |   |---elements/
    |   |---mixins/
    |   |---pages/
    |

*   `.temp/` temporary folder used save files after populating templates with data, before polymer build takes over them.
*   `appengine/` contains App Engine application that runs CRON job to send scheduled push notifications.
*   `bower_components/` is the place for project dependencies.
*   `build/` is the directory to deploy to production.
*   `config/` folder for core project setup.
*   `data/` folder with all data for the template including rest of config and resources for pages.
*   `docs/` documentation.
*   `functions/` directory with Firebase [cloud functions](https://firebase.google.com/docs/functions/) used for notifications, optimizations, saving data, etc.
*   `gulp-tasks/` contains gulp tasks moved from `gulpfile.js` to make the file cleaner.
*   `images/` is for static images.
*   `internals/` contains scripts that helps user to work with the project and it's data ([docs](./firebase-utils.md)).
*   `node_modules/` is the place of Node dependencies.
*   `scripts/` is the place for JS scripts.
*   `src/` is where you store all of your source code and do all of your development.
*   `effects/` is where you keep your effects for instance `transparent-scroll.html` that helps to achieve transparent toolbar before the scroll.
*   `elements/` is where you keep your custom elements.
*   `pages/` is where you keep your pages' description.


## Build and serve

1. Run locally
   * `cd` into the base directory
   * `npm install` or `yarn`
   * `npm run serve` or `yarn serve`
1. Deploy
   * `npm run deploy` or `yarn deploy`

*NOTE:* By default command using configurations from `/configs/development.json`.
To serve locally or deploy the production app use `yarn serve:prod` and `yarn deploy:prod` respectively.

## Next steps

Now that your Hoverboard is up and running, learn how to
[configure app](configure-app.md) for your needs, or how to [deploy the app to the web](deploy.md).
