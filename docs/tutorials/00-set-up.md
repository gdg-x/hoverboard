# Set up

Follow the instructions below to install, build, and run the
Project Hoverboard locally in less than 15 minutes.

## Install the Hoverboard and dependencies

1. [Fork repository](https://github.com/gdg-x/hoverboard/fork) and clone your fork locally
1. Install [Node.js (v22)](https://nodejs.org/en/download/)
1. Install project dependencies: `npm ci` (`yarn` should work but it's not officially supported)
1. Create [Firebase account](https://console.firebase.google.com) and login into [Firebase CLI](https://firebase.google.com/docs/cli/): `npx firebase login`
1. Update your site's config and content in [packages/config](/packages/config). More info can be found [here](01-configure-app.md)
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
    |---packages/storage/
    |---packages/web/
    |   |---dist/
    |   |---node_modules/
    |   |---public/
    |   |   |---data/
    |   |   |---images/
    |   |---src/
    |   |   |---components/
    |   |   |---controllers/
    |   |   |---models/
    |   |   |---pages/
    |   |   |---store/
    |   |   |---styles/
    |   |   |---utils/
    |

- `config/` folder for core project setup, consumed by `packages/web`'s build.
- `docs/` documentation.
- `packages/cli/` contains the `hoverboard` developer CLI that helps you work with the project and its data ([docs](./firebase-utils.md)).
- `packages/server/` directory with Firebase [cloud functions](https://firebase.google.com/docs/functions/) (in `functions/`) used for notifications, optimizations, saving data, etc.
- `packages/storage/` Firestore, Storage and Realtime Database security rules, Firestore indexes, and their tests.
- `packages/web/` is the frontend app (own `package.json`/`node_modules`):
  - `dist/` is the directory to deploy to production.
  - `public/` is copied to `dist/` by the build.
    - `data/` folder with the site settings, text resources, blog posts, FAQ and code of conduct.
    - `images/` folder with the site images.
  - `src/` is where you store all of your source code and do all of your development.
    - `components/` is where you keep your LitElement custom elements, grouped by area.
    - `controllers/` is where you keep your shared Lit reactive controllers.
    - `models/` is where you keep your data types.
    - `pages/` is where you keep your page elements.
    - `store/` is where you keep your Redux state.
    - `styles/` is where you keep your theme.
    - `utils/` is where you keep your shared helpers.

## Build and serve

1. Specify the Firebase project to use for development and deploy target
   - `npx firebase use <projectid>`.
1. Run locally
   - `npm start`
1. Deploy
   - `./hbd deploy`

There are two CLI flags you can set when running npm scripts:

- `NODE_ENV`: Control if code should be optimized for a production deployment with minimization or for faster local development.
- `BUILD_ENV`: Which `config/<BUILD_ENV>.json` file overrides values in `packages/config/site.json`, such as the site URL or Google Maps key. Development builds use `config/development.json` when it exists.

The common npm scripts are:

- `npm start`: Start a local development server using the Firebase emulator with livereload.
- `npm run build`: Build a production version of the site to the `dist` directory.
- `npm run serve`: Build a production version of the site and serve it locally.
- `./hbd deploy`: Build a production version of the site and deploy it to Firebase.

Below is the grid of the common npm script commands and their supported CLI flags.

|          | `NODE_ENV`    | `BUILD_ENV`             |
| -------- | ------------- | ----------------------- |
| `start`  | `development` | `development`\|`custom` |
| `build`  | `production`  | `development`\|`custom` |
| `serve`  | `production`  | `development`\|`custom` |
| `deploy` | `production`  | `development`\|`custom` |

For example `npm start` only supports `NODE_ENV=development` and uses `config/development.json` if it exists, while `npm run build` only supports `NODE_ENV=production` and uses only `packages/config/site.json` unless `BUILD_ENV` is set.

## Next steps

Now that your Hoverboard is up and running, learn how to
[configure the app](01-configure-app.md) for your needs, or how to [deploy the app to the web](04-deploy.md).
