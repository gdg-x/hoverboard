# Set up

Follow the instructions below to install, build, and run the
Project Hoverboard locally in less than 15 minutes.

## Install the Hoverboard and dependencies

1. [Fork repository](https://github.com/gdg-x/hoverboard/fork) and clone your fork locally
1. Install [Node.js (v22)](https://nodejs.org/en/download/)
1. Install project dependencies: `npm ci` (`yarn` should work but it's not officially supported)
1. Create [Firebase account](https://console.firebase.google.com) and login into [Firebase CLI](https://firebase.google.com/docs/cli/): `npx firebase login`
1. Update your site's config and content in [packages/config](/packages/config). More info can be found [here](01-configure-app.md)
1. Run the app locally. Local development always runs on the [Firebase emulators](https://firebase.google.com/docs/emulator-suite) with the `demo-hoverboard` project, so it needs no Firebase project and never reads or writes live data.
   - _Tip: `./hbd setup` logs in and selects the Firebase project you deploy to, then runs `./hbd doctor` to confirm your environment is ready._
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
    |---docs/
    |---packages/cli/
    |---packages/config/
    |---packages/server/
    |---packages/storage/
    |---packages/web/
    |   |---defaults/
    |   |---dist/
    |   |---node_modules/
    |   |---public/
    |   |   |---images/
    |   |---schemas/
    |   |---src/
    |   |   |---components/
    |   |   |---controllers/
    |   |   |---models/
    |   |   |---pages/
    |   |   |---store/
    |   |   |---styles/
    |   |   |---utils/
    |

- `docs/` documentation.
- `packages/cli/` contains the `hoverboard` developer CLI that helps you work with the project and its data ([docs](./firebase-utils.md)).
- `packages/config/` is your site's config and content: `site.json`, event text, FAQ, code of conduct and blog posts ([docs](01-configure-app.md)).
- `packages/server/` directory with Firebase [cloud functions](https://firebase.google.com/docs/functions/) (in `functions/`) used for notifications, optimizations, saving data, etc.
- `packages/storage/` Firestore, Storage and Realtime Database security rules, Firestore indexes, and their tests.
- `packages/web/` is the frontend app (own `package.json`/`node_modules`):
  - `defaults/` has the upstream defaults that `packages/config` overrides.
  - `dist/` is the directory to deploy to production.
  - `public/` is copied to `dist/` by the build.
    - `images/` folder with the site images.
  - `schemas/` has the JSON Schemas for `packages/config`.
  - `src/` is where you store all of your source code and do all of your development.
    - `components/` is where you keep your LitElement custom elements, grouped by area.
    - `controllers/` is where you keep your shared Lit reactive controllers.
    - `models/` is where you keep your data types.
    - `pages/` is where you keep your page elements.
    - `store/` is where you keep your Redux state.
    - `styles/` is where you keep your theme.
    - `utils/` is where you keep your shared helpers.

## Build and serve

1. Run locally
   - `npm start`
1. Select the Firebase project to deploy to
   - `npx firebase use <projectid>`.
1. Deploy
   - `./hbd deploy`

`NODE_ENV` controls whether code is optimized for a production deployment with minimization, or for faster local development. It does not change the site config: every build reads `packages/config`.

The common npm scripts are:

- `npm start`: Start a local development server using the Firebase emulator with livereload.
- `npm run build`: Build a production version of the site to the `dist` directory.
- `npm run serve`: Build a production version of the site and serve it locally on the emulators.
- `./hbd deploy`: Build a production version of the site and deploy it to Firebase.

Locally, the app runs on the emulators with the `demo-hoverboard` project. `demo-` projects only exist in the emulators, so sign-in uses the Auth emulator, and push notifications, Analytics and Performance Monitoring are off.

## Next steps

Now that your Hoverboard is up and running, learn how to
[configure the app](01-configure-app.md) for your needs, or how to [deploy the app to the web](04-deploy.md).
