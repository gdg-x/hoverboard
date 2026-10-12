# Set up

Follow the instructions below to install, build, and run the
Project Hoverboard locally in less than 15 minutes.

## Install the Hoverboard and dependencies

1. [Fork repository](https://github.com/gdg-x/hoverboard/fork) and clone your fork locally
1. Install [Node.js (v22)](https://nodejs.org/en/download/)
1. Install project dependencies: `npm ci` (`yarn` should work but it's not officially supported)
1. Run `./hb init` and answer its questions. It signs you in to Firebase, creates or picks your Firebase project, copies the demo site in `packages/demo-config` to `packages/config` the first time, writes your event's name, dates, whether it is in person, online or both, its venue or stream link, organizer, theme and features to [packages/config](/packages/config), and checks that the project is on the Blaze plan. You can run it again later; your current values are the defaults. It also:
   - Replaces the demo's text with starter text for your event the first time, and asks for the text under the title of each page and what a ticket includes.
   - Copies your logo, icon and share image into `packages/config/public/images`.
   - Creates the Firestore database in the location you pick, near most visitors. The location can't change later.
   - Adds the sample content, nothing, or the content of an export such as last year's site (`--from <folder>`).
   - Offers daily backups on the Blaze plan, and the first deploy.
   - In a clone of Hoverboard, with the [GitHub CLI](https://cli.github.com/) signed in, offers to create a private repository for the site, push to it and run `./hb setup-github`. It renames the clone's `origin` to `upstream`, which `./hb upgrade` uses. Without `gh`, it prints the steps.
   - Ends with `./hb doctor`, the site URL and the console links.
   - _Tip: `./hb init --help` lists flags such as `--project`, `--details <file>`, `--logo <file>` and `--location <id>` for running it without questions. The details file can have a `resources` object with your own text for `content/resources.json`._
1. Commit `packages/config`, unless `./hb init` pushed it to a new repository.
1. Update the rest of your site's config and content in [packages/config](/packages/config). More info can be found [here](01-configure-app.md)
1. Run the app locally. Local development always runs on the [Firebase emulators](https://firebase.google.com/docs/emulator-suite) with the `demo-hoverboard` project, so it needs no Firebase project and never reads or writes live data.
   - _Tip: `./hb setup` logs in and selects the Firebase project you deploy to, then runs `./hb doctor` to confirm your environment is ready. `./hb status` shows the project, the versions, the features that are on, the last deploy, your changes to Hoverboard's files and the document count of each collection, in the emulator or, with `--production`, the live site._
1. Seed the local Firestore emulator with data
   - [Optional] You can edit the files in `docs/sample-data/collections` to use your own data
   - Run `npm start` in one terminal to launch the app together with the Firebase emulators. The site is at http://localhost:4321
   - In another terminal, run `./hb data seed` to import `docs/sample-data` into the running emulator, then reload the page
   - Browse and edit the seeded data in the [Emulator UI](http://localhost:4000/firestore)
   - [Optional] Run `./hb emulators save` to persist your edits to `.firebase/emulator-data`, so they're automatically reloaded next time you run `npm start`

_Tip: See [Firestore utils](firebase-utils.md) for more on seeding, exporting, and copying Firestore data._

## Directory structure

The diagram below is a brief summary of the directories within the project.

    /
    |---docs/
    |---packages/cli/
    |---packages/config/
    |---packages/demo-config/
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
- `packages/config/` is your site's config and content: `site.json`, event text, FAQ, code of conduct, blog posts, images in `public/` and `custom.css` ([docs](01-configure-app.md)). Hoverboard never changes it.
- `packages/demo-config/` is the demo site's, which `./hb init` copies, and the build uses until `packages/config` has a `site.json`. Tests use it too.
- `packages/server/` directory with Firebase [cloud functions](https://firebase.google.com/docs/functions/) (in `functions/`) used for notifications, optimizations, saving data, etc.
- `packages/storage/` Firestore and Storage security rules, Firestore indexes, and their tests.
- `packages/web/` is the frontend app (own `package.json`/`node_modules`):
  - `defaults/` has the upstream `site.json` defaults that `packages/config` overrides.
  - `dist/` is the directory to deploy to production.
  - `public/` is copied to `dist/` by the build, with `packages/config/public/` over it.
    - `images/` folder with Hoverboard's own images.
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

The build reads content from the Firestore emulator unless `FIRESTORE_TARGET` says otherwise. `FIRESTORE_TARGET=production` reads production Firestore, which `./hb deploy` and the deploy workflows do. `FIRESTORE_TARGET=none` builds the pages without content, which CI uses to check that the site builds. `FIRESTORE_TARGET=sample` builds with the sample data in `docs/sample-data`, without Firestore or Java. It makes the same pages as the emulator after `./hb data seed`.

Locally, the app runs on the emulators with the `demo-hoverboard` project. `demo-` projects only exist in the emulators, so sign-in uses the Auth emulator, and push notifications, Analytics and Performance Monitoring are off.

On the emulators, images without alt text, or with an empty one, have a thick red outline, so you can add the text before you deploy. Alt text describes an image to people who can't see it. Deployed sites don't show the outline.

## Next steps

Now that your Hoverboard is up and running, learn how to
[configure the app](01-configure-app.md) for your needs, or how to [deploy the app to the web](04-deploy.md).
