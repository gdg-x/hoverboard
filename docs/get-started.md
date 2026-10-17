# Get started

Go from a fresh clone of Hoverboard to a running, deployed site for your event.

## What you need

- [Node.js](https://nodejs.org/en/download/) and npm, in the versions listed under `engines` in [`package.json`](../package.json).
- Java, for the local [Firebase emulators](https://firebase.google.com/docs/emulator-suite).
- A Google account, for [Firebase](https://console.firebase.google.com/).
- Optional: the [GitHub CLI](https://cli.github.com/) (`gh`), signed in, if you want `./hb init` to create a private repository for your site and set up GitHub Actions deploys.

## Fork and install

1. [Fork the repository](https://github.com/gdg-x/hoverboard/fork) and clone your fork, or clone Hoverboard directly if `./hb init` will create your repository.
1. Install the dependencies from the repository root:

```console
npm ci
```

## Set up your site with `hb init`

Run `./hb init` and answer its questions:

```console
./hb init
```

It signs you in to Firebase, creates or picks your Firebase project, copies the demo site in `packages/demo-config` to `packages/config` the first time, replaces the demo's text with starter text for your event, writes your event's name, dates, whether it is in person, online or both, its venue or stream link, organizer, theme and features to `packages/config`, and checks that the project is on the Blaze plan.

You can run `./hb init` again later; your current values are the defaults. See [`hb init` in the CLI reference](reference/cli.md#hb-init) for everything it sets up and the flags for running it without questions.

Commit `packages/config`, unless `./hb init` already pushed it to a new repository.

## Run it locally

Local development runs on the Firebase emulators with the `demo-hoverboard` project, so it never reads or writes your live project's data. See [How it works](how-it-works.md#local-development-and-emulators).

1. Start the app and the emulators in one terminal. The site opens at http://localhost:4321:

```console
npm start
```

1. In another terminal, import the sample data in `docs/sample-data` into the running emulator, then reload the page:

```console
./hb data seed
```

1. Browse and edit the data in the [Emulator UI](http://localhost:4000/firestore). On the emulators, a `DEV` bar across the top of the page lets you try the themes and pick any date and time at the event. See [Run your event](guides/run-your-event.md#see-where-you-are).
1. Optional: save your emulator edits to `.firebase/emulator-data` so they reload the next time you run `npm start`:

```console
./hb emulators save
```

See [Manage data](guides/manage-data.md) for exporting and importing Firestore data.

## Make it yours

Your site's config and content live in `packages/config`:

- [Event details](guides/event-details.md): your event's name, dates, time zone, venue or stream link in `packages/config/site.json`.
- [Content](guides/content.md): your event text in `packages/config/content/resources.json`, the FAQ and code of conduct, your images in `packages/config/public/`, and speakers and sessions in Firestore.
- [Look and feel](guides/look-and-feel.md): the theme, colors, fonts, logo and app icon.

## Deploy

When your site is ready to publish, build and deploy it to the Firebase project in `packages/config/site.json`:

```console
./hb deploy
```

`./hb deploy` checks your Node.js version, Firebase project and Firestore content, asks for confirmation, then builds every page from production Firestore and deploys to Firebase. The live URL is printed at the end.

To deploy automatically from pull requests and merges on GitHub, see [Deploy](guides/deploy.md#deploying-to-firebase-with-github-actions).

## Next steps

- [Run your event](guides/run-your-event.md): what to publish before, during and after the event, and what visitors see at each stage.
- [Schedule](guides/schedule.md): tracks, session times, stream links and publishing the schedule.
- [Sign-in](guides/sign-in.md): turn on email links or social sign-in in the Firebase console.
- [Security](guides/security.md): API key restrictions, authorized domains and spend caps before launch.
