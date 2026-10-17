# How it works

Where your config, content and text live, how pages are built and updated, and how local development differs from production.

## Where things live

- `packages/config/` is your site's own config and content. Hoverboard never changes it, so upgrades don't conflict here:
  - `site.json`: site settings, merged over the defaults in `packages/web/defaults/site.json`.
  - `content/`: event text in `resources.json`, the FAQ (`faq.md`), the code of conduct (`coc.md`), blog posts (`posts/`), and translations in `locales/<locale>/`.
  - `public/`: your images, such as `images/logo.svg`, `images/icon.png` and the share image. The build serves them from the site's root, over the files in `packages/web/public/`.
  - `custom.css`: your own styles, loaded after the theme.
  - `editions.json`: archived past editions of your event.
- `packages/demo-config/` is the demo site that `./hb init` copies the first time. Until `packages/config/site.json` exists, the build, `npm start` and `./hb` use the demo, and deploys stop so you can't deploy the demo by mistake.
- **Firestore** holds the speakers, sessions, partners, team, tickets, videos, gallery, blog list and previous speakers, as well as visitor data such as saved sessions, feedback, reactions and subscribers. See [Content model](reference/content-model.md).
- `packages/server/functions/` holds the Cloud Functions that send push notifications.
- `packages/storage/` holds the Firestore and Storage security rules, indexes and schema.
- `packages/web/` is the web app, and `packages/cli/` is the `./hb` CLI. See [Development](contributing/development.md) for the full repository layout.

## Where text comes from

The text on the site comes from your config, from Firestore and from the app:

| Text                                                                                         | Where it is                                | Who edits it                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------- |
| Event text, such as the title, description, hero descriptions, about blocks and footer links | `packages/config/content/resources.json`   | You                          |
| The FAQ, the Code of Conduct and blog posts                                                  | `packages/config/content/`                 | You                          |
| Sessions, speakers, the schedule, the team, partners and the blog list                       | Firestore                                  | You, in the database         |
| UI text, such as buttons, labels, page titles, navigation and messages                       | `msg()` calls in `packages/web/src`        | Upstream                     |
| UI translations                                                                              | `packages/translations/xliff/<locale>.xlf` | Upstream, not edited by hand |

UI text is the same on every site, so it is not in `packages/config`. To change its wording, open a pull request upstream, so every site gets the change and translators see it. A fork can change a `msg()` call too. Then run `npm --prefix packages/web run localize:extract`, and expect conflicts when you upgrade. Existing translations of that text keep the old meaning. See [Languages](guides/languages.md).

## How pages are built

When you deploy, the build reads your content from production Firestore and renders every page to static HTML in `packages/web/dist`, along with the share images for speakers and sessions. Search engines and link previews read that rendered HTML.

When a visitor opens a page in the browser, the page hydrates and connects to Firestore, so edits made in the Firebase console show up live in visitors' browsers as soon as a page opens.

After you change content in Firestore, deploy again so the rendered HTML and share images match the live data. You can run `./hb deploy` on your computer or trigger the `Deploy` workflow on GitHub. See [Deploy](guides/deploy.md).

## What visitors see changes on its own

Nothing in `site.json` names the stage the event is in. The dates in `event`, the call for papers, the ticket sale dates, `schedule.published` and the content in Firestore decide what the home page, the header and the navigation show.

Each visitor's browser checks the clock in `event.timezone` when a page opens, so time-based changes—such as the call for papers opening or closing, tickets going on sale, **Live now** and **On now** during the event, and the thank-you state after the event—happen without a deploy. Adding content, such as the first speaker or publishing the schedule, takes effect on the next deploy. See [Run your event](guides/run-your-event.md) for what to publish when.

## Local development and emulators

Local development with `npm start` and `npm run serve` always uses the local [Firebase emulators](https://firebase.google.com/docs/emulator-suite) with the `demo-hoverboard` project, whatever `firebase.projectId` is set to in `site.json`. It needs no Firebase project and never reads or writes live data:

- `demo-` projects only exist in the emulators, so sign-in uses the Auth emulator, and push notifications, Analytics and Performance Monitoring are off.
- Every site has the `DEV` bar across the top on the emulators, where you can try the built-in themes, spacing, light or dark, attendance mode, and pick any date and time on the clock to preview any stage of your event. Deploys leave the bar off.
- Images without alt text, or with an empty one, have a thick red outline on the emulators so you can fix them before deploying. Deployed sites don't show the outline.

## Emulator or production

The `./hb` data, backup, notify, status and migration commands use the running Firestore emulator by default. Pass `--production` to use the Firebase project in `packages/config/site.json`, signed in with your Firebase CLI login (`npx firebase login`).

The web build (`npm run build`) reads content from the Firestore emulator unless `FIRESTORE_TARGET` says otherwise:

- Unset: reads the running Firestore emulator.
- `FIRESTORE_TARGET=production`: reads production Firestore, which `./hb deploy` and the deploy workflows set.
- `FIRESTORE_TARGET=none`: builds the pages without Firestore and without content, which CI uses to check that the site builds.
- `FIRESTORE_TARGET=sample`: builds from `docs/sample-data` without Firestore or Java, producing the same pages as the emulator after `./hb data seed`.

Only the build reads `FIRESTORE_TARGET`; `./hb` commands use `--production`.

## Editions

A recurring event keeps one repository and creates a new Firebase project for each edition:

- **Each edition gets the free quota.** Firestore includes one free database per project, so the new edition starts on the free quota, and archived editions stay within it.
- **Archives can't change.** When you switch to the new edition, the old project's functions are deleted, its Firestore rules become read-only, its write features are turned off, and every page shows a banner linking to the current edition.

See [Next edition](guides/next-edition.md) for the steps to start a new edition and archive the old one.

## Cloud Functions

Hoverboard's Cloud Functions send push notifications: general notifications and session reminders for My Schedule. They do not generate the schedule or modify content.

The functions read `features` and `event.timezone` from a copy of `site.json` made when the functions are built, and reminder links use `event.attendance`, `event.stream` and `schedule.tracks`. After changing any of these in `site.json`, deploy the functions again with `./hb deploy` or the deploy workflow.

With `features.functions` set to `false`, deploys skip Cloud Functions and the site can run on the free Spark plan without notifications. See [Firebase project](guides/firebase-project.md#billing) and [Notifications](guides/notifications.md).

## See also

- [Get started](get-started.md)
- [Configuration reference](reference/configuration.md)
- [Features reference](reference/features.md)
- [CLI reference](reference/cli.md)
