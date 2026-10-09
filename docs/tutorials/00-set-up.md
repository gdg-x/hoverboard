# Set up

Follow the instructions below to install, build, and run the
Project Hoverboard locally in less than 15 minutes.

## Install the Hoverboard and dependencies

1. [Fork repository](https://github.com/gdg-x/hoverboard/fork) and clone your fork locally
1. Install [Node.js (v22)](https://nodejs.org/en/download/)
1. Install project dependencies: `npm ci` (`yarn` should work but it's not officially supported)
1. Run `./hb init` and answer its questions. It signs you in to Firebase, creates or picks your Firebase project, writes your event's name, dates, venue, organizer, theme and features to [packages/config](/packages/config), and checks that the project is on the Blaze plan. It can also deploy the site and add sample content. You can run it again later; your current values are the defaults.
   - _Tip: `./hb init --help` lists flags such as `--project` and `--details <file>` for running it without questions._
1. Update the rest of your site's config and content in [packages/config](/packages/config). More info can be found [here](01-configure-app.md)
1. Run the app locally. Local development always runs on the [Firebase emulators](https://firebase.google.com/docs/emulator-suite) with the `demo-hoverboard` project, so it needs no Firebase project and never reads or writes live data.
   - _Tip: `./hb setup` logs in and selects the Firebase project you deploy to, then runs `./hb doctor` to confirm your environment is ready._
1. Seed the local Firestore emulator with data
   - [Optional] You can edit `docs/default-firebase-data.json` to use your own data
   - Run `npm start` in one terminal to launch the app together with the Firebase emulators. The site is at http://localhost:4321
   - In another terminal, run `./hb firestore-init` to import `docs/default-firebase-data.json` into the running emulator, then reload the page
   - Browse and edit the seeded data in the [Emulator UI](http://localhost:4000/firestore)
   - [Optional] Run `./hb firestore-export` to persist your edits to `.firebase/emulator-data`, so they're automatically reloaded next time you run `npm start`

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
    |   |   |---data/
    |   |   |---layouts/
    |   |   |---models/
    |   |   |---pages/
    |   |   |---routes/
    |   |   |---store/
    |   |   |---styles/
    |   |   |---utils/
    |   |   |---views/
    |

- `docs/` documentation.
- `packages/cli/` contains the `hoverboard` developer CLI that helps you work with the project and its data ([docs](./firebase-utils.md)).
- `packages/config/` is your site's config and content: `site.json`, event text, FAQ, code of conduct and blog posts ([docs](01-configure-app.md)).
- `packages/server/` directory with Firebase [cloud functions](https://firebase.google.com/docs/functions/) (in `functions/`) used for notifications, optimizations, saving data, etc.
- `packages/storage/` Firestore and Storage security rules, Firestore indexes, and their tests.
- `packages/web/` is the frontend app (own `package.json`/`node_modules`):
  - `defaults/` has the upstream `site.json` defaults that `packages/config` overrides.
  - `dist/` is the directory to deploy to production.
  - `public/` is copied to `dist/` by the build.
    - `images/` folder with the site images.
  - `schemas/` has the JSON Schemas for `packages/config`.
  - `src/` is where you store all of your source code and do all of your development.
    - `components/` is where you keep your LitElement custom elements, grouped by area.
    - `controllers/` is where you keep your shared Lit reactive controllers.
    - `data/` reads the site's content from Firestore when the site is built.
    - `layouts/` has the Astro layout that every page uses.
    - `models/` is where you keep your data types.
    - `pages/` has the Astro pages that every site has: not found, offline and the web app manifest.
    - `routes/` has the other Astro pages. The build only includes the pages of the features that are on.
    - `store/` is where you keep your Redux state.
    - `styles/` has the shared styles: type scale, spacing and motion.
    - `themes/` has the built-in themes, with their colors and fonts.
    - `utils/` is where you keep your shared helpers.
    - `views/` is where you keep your page elements.

## Build and serve

1. Run locally
   - `npm start`
1. Set the Firebase project to deploy to
   - `firebase.projectId` in `packages/config/site.json`.
1. Deploy
   - `./hb deploy`

`NODE_ENV` controls whether code is optimized for a production deployment with minimization, or for faster local development. It does not change the site config: every build reads `packages/config`.

The common npm scripts are:

- `npm start`: Start the Firebase emulators and a development server at http://localhost:4321 that reloads when you edit the code. Pages show the emulator's current data when you reload them.
- `npm run build`: Build every page of the site to `packages/web/dist`, with the content in the Firestore emulator. The emulator must be running.
- `npm run serve`: Build the site with the emulator's data, then serve it on the Hosting emulator at http://localhost:5000, as Firebase Hosting would.
- `./hb deploy`: Build the site with the content in your production Firestore and deploy it to Firebase.

The build reads content from the Firestore emulator unless `FIRESTORE_TARGET` says otherwise. `FIRESTORE_TARGET=production` reads production Firestore, which `./hb deploy` and the deploy workflows do. `FIRESTORE_TARGET=none` builds the pages without content, which CI uses to check that the site builds.

Locally, the app runs on the emulators with the `demo-hoverboard` project. `demo-` projects only exist in the emulators, so sign-in uses the Auth emulator, and push notifications, Analytics and Performance Monitoring are off.

## Next steps

Now that your Hoverboard is up and running, learn how to
[configure the app](01-configure-app.md) for your needs, or how to [deploy the app to the web](04-deploy.md).
