# Set up

Follow the instructions below to install, build, and run the
Project Hoverboard locally in less than 15 minutes.

## Install the Hoverboard and dependencies

1. [Fork repository](https://github.com/gdg-x/hoverboard/fork) and clone your fork locally
1. Install [Node.js (v16)](https://nodejs.org/en/download/)
1. Install project dependencies: `npm ci` (`yarn` should work but it's not officially supported)
1. Create [Firebase account](https://console.firebase.google.com) and login into [Firebase CLI](https://firebase.google.com/docs/cli/): `npx firebase login`
1. Update [Hoverboard config](/config) and [Resources](/data). More info can be found [here](01-configure-app.md)
1. Select your Firebase project `npx firebase use <projectId>` (this is only needed to load your app's web config; local development runs against the [Firestore emulator](https://firebase.google.com/docs/emulator-suite), so it never reads or writes your project's live data)
   - _Tip: `./hbd setup` automates the login and project-selection steps above, then runs `./hbd doctor` to confirm your environment is ready._
1. Seed the local Firestore emulator with data
   - [Optional] You can edit `docs/default-firebase-data.json` to use your own data
   - Run `npm start` in one terminal to launch the app together with the Firebase emulators
   - In another terminal, run `./hbd firestore-init` to import `docs/default-firebase-data.json` into the running emulator
   - Browse and edit the seeded data in the [Emulator UI](http://localhost:4000/firestore)
   - [Optional] Run `./hbd firestore-export` to persist your edits to `.firebase/emulator-data`, so they're automatically reloaded next time you run `npm start`

_Tip: See [Firestore utils](firebase-utils.md) for more on seeding, exporting, and copying Firestore data._

## Directory structure

The diagram below is a brief summary of the directories within the project.

    /
    |---config/
    |---docs/
    |---packages/cli/
    |---packages/server/
    |---packages/web/
    |   |---data/
    |   |---dist/
    |   |---node_modules/
    |   |---src/
    |   |   |---components/
    |   |   |---elements/
    |   |   |---mixins/
    |   |   |---pages/
    |

- `config/` folder for core project setup, consumed by `packages/web`'s build.
- `docs/` documentation.
- `packages/cli/` contains the `hoverboard` developer CLI that helps you work with the project and its data ([docs](./firebase-utils.md)).
- `packages/server/` directory with Firebase [cloud functions](https://firebase.google.com/docs/functions/) (in `functions/`) used for notifications, optimizations, saving data, etc.
- `packages/web/` is the frontend app (own `package.json`/`node_modules`):
  - `data/` folder with all data for the template including rest of config and resources for pages.
  - `dist/` is the directory to deploy to production.
  - `src/` is where you store all of your source code and do all of your development.
    - `components/` is where you keep your new LitElement custom elements.
    - `elements/` is where you keep your old Polymer custom elements.
    - `mixins/` is where you keep your shared component mixins.
    - `pages/` is where you keep your pages' description.

## Build and serve

1. Specify the Firebase project to use for development and deploy target
   - `npx firebase use <projectid>`.
1. Run locally
   - `npm start`
1. Deploy
   - `./hbd deploy`

There are two CLI flags you can set when running npm scripts:

- `NODE_ENV`: Control if code should be optimized for a production deployment with minimization or for faster local development.
- `BUILD_ENV`: Which `config` JSON file should be used when building. This is where you set the Firebase project details.

The common npm scripts are:

- `npm start`: Start a local development server using the Firebase emulator with livereload.
- `npm run build`: Build a production version of the site to the `dist` directory.
- `npm run serve`: Build a production version of the site and serve it locally.
- `./hbd deploy`: Build a production version of the site and deploy it to Firebase.

Below is the grid of the common npm script commands and their supported CLI flags.

|          | `NODE_ENV`    | `BUILD_ENV`                           |
| -------- | ------------- | ------------------------------------- |
| `start`  | `development` | `development`\|`production`\|`custom` |
| `build`  | `production`  | `development`\|`production`\|`custom` |
| `serve`  | `production`  | `development`\|`production`\|`custom` |
| `deploy` | `production`  | `development`\|`production`\|`custom` |

For example `npm start` only supports `NODE_ENV=development` and defaults to `BUILD_ENV=development` while `npm run build` only supports `NODE_ENV=production` and defaults to `BUILD_ENV=production`.

## Next steps

Now that your Hoverboard is up and running, learn how to
[configure the app](01-configure-app.md) for your needs, or how to [deploy the app to the web](04-deploy.md).
