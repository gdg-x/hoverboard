# Documentation

Documentation for setting up, running and maintaining a Hoverboard conference website, and for contributing to Hoverboard itself.

## Who are you?

Pick the role that fits what you're doing to see the pages you need, in order:

- **[First-time organizer](#first-time-organizer):** You're making a site for a new event.
- **[Returning organizer](#returning-organizer):** Your event has a Hoverboard site, and you're starting the next one.
- **[Content editor](#content-editor):** You keep speakers, sessions and posts up to date.
- **[Fork maintainer](#fork-maintainer):** You keep a site's code, deploys and data working.
- **[Contributor](#contributor):** You're changing Hoverboard itself.

### First-time organizer

You're making a site for a new event:

1. [Get started](get-started.md)
1. [Event details](guides/event-details.md)
1. [Content](guides/content.md)
1. [Look and feel](guides/look-and-feel.md)
1. [Pages](guides/pages.md)
1. [Firebase project](guides/firebase-project.md)
1. [Deploy](guides/deploy.md)
1. [Accessibility](guides/accessibility.md)
1. [Run your event](guides/run-your-event.md)

### Returning organizer

Your event has a Hoverboard site, and you're starting the next one:

1. [Next edition](guides/next-edition.md)
1. [Upgrade](guides/upgrade.md)
1. [Manage data](guides/manage-data.md#export-collections-as-csv) (subscriber export)
1. [Run your event](guides/run-your-event.md), and the [first-time organizer](#first-time-organizer) guides for what changed

### Content editor

You keep speakers, sessions and posts up to date:

1. [Content](guides/content.md)
1. [Schedule](guides/schedule.md)
1. [Edit on GitHub](guides/edit-on-github.md)
1. [Content model reference](reference/content-model.md)

### Fork maintainer

You keep a site's code, deploys and data working:

1. [How it works](how-it-works.md)
1. [Deploy](guides/deploy.md)
1. [Security](guides/security.md)
1. [Upgrade](guides/upgrade.md)
1. [Backups](guides/backups.md)
1. [Customize](guides/customize.md)
1. [Look and feel](guides/look-and-feel.md#custom-css) (custom CSS)
1. [CLI reference](reference/cli.md)

### Contributor

You're changing Hoverboard itself:

1. [Development](contributing/development.md)
1. [Releases](contributing/releases.md)
1. [`AGENTS.md`](../AGENTS.md)

## Get started

- [Get started](get-started.md): go from a fresh clone of Hoverboard to a running, deployed site.

## Set up your site

- [Firebase project](guides/firebase-project.md): connect an existing Firebase project, choose Blaze or Spark, and set a spend cap and budget.
- [Sign-in](guides/sign-in.md): configure `auth.providers` and enable sign-in methods in the Firebase console.
- [Deploy](guides/deploy.md): deploy with `./hb deploy`, set up GitHub Actions deploys, and configure a custom domain.
- [Edit on GitHub](guides/edit-on-github.md): edit config and content in the browser with pull request previews.
- [Security](guides/security.md): what Hoverboard protects, what you configure in Firebase and GitHub, and the Content Security Policy.

## Your event

- [Event details](guides/event-details.md): set the event name, organizer, dates, time zone, attendance mode, venue and stream link.
- [Schedule](guides/schedule.md): define tracks, place sessions on the schedule, configure live streams and publish the schedule.
- [Content](guides/content.md): edit event text, speakers, sessions, partners, tickets, Markdown pages and images, and add content editors.
- [Pages](guides/pages.md): configure navigation, the home page hero and sections, and speaker and team pages.
- [Attending page](guides/attending-page.md): fill in directions, door times, venue accessibility, hotels, Wi-Fi and floor plan images.
- [Languages](guides/languages.md): configure site locales and translate your event's text and Markdown pages.
- [Accessibility](guides/accessibility.md): checklist for alt text, partner names, video captions, headings, venue details and custom colors.

## Look and feel

- [Look and feel](guides/look-and-feel.md): pick a built-in theme, customize colors, fonts, logo, app icon, tag colors, illustrations and custom CSS.

## Attendee features

- [Notifications](guides/notifications.md): send automatic My Schedule session reminders and manual general push notifications.
- [Reactions](guides/reactions.md): let signed-in attendees react to sessions and manage public profiles.
- [Share images](guides/share-images.md): generate social preview images for every speaker and session page at build time.
- [Features reference](reference/features.md): every feature flag, its default, what it adds and what it requires.

## Run your event

- [Run your event](guides/run-your-event.md): what to publish before, during and after the event, and what visitors see at each stage.

## Keep it running

- [Manage data](guides/manage-data.md): seed the emulator, export subscribers as CSV, and import, export, pull, push, check or fix Firestore data.
- [Backups](guides/backups.md): back up and restore Firestore data and Auth users, undo changes, and schedule automated database backups.
- [Next edition](guides/next-edition.md): start next year's edition in a new Firebase project and archive the old one.
- [Upgrade](guides/upgrade.md): upgrade to a new Hoverboard release, run config and data migrations, and check supported versions.
- [Customize](guides/customize.md): keep your changes in `packages/config`, minimize code changes, and see what `./hb upgrade` resolves.

## Reference

- [Configuration](reference/configuration.md): files in `packages/config`, defaults, validation, and every top-level key in `site.json` and `resources.json`.
- [Features](reference/features.md): every feature flag in `site.json`, dependencies, hidden empty features, `demo` and archived editions.
- [Content model](reference/content-model.md): Firestore collections, schemas, document kinds, and the export folder format.
- [CLI](reference/cli.md): every `./hb` command, shared flags, exit codes, npm scripts and `FIRESTORE_TARGET`.

## How it works

- [How it works](how-it-works.md): where files and text live, how pages are built, event stages, local emulators, editions and Cloud Functions.
- [Accessibility statement](ACCESSIBILITY.md): Hoverboard's WCAG 2.2 AA goal, automated checks, supported environments and reporting barriers.
- [Security policy](../.github/SECURITY.md): supported versions and how to report a vulnerability privately.

## Contributing

- [Development](contributing/development.md): local setup, repository layout, running the emulators, and running the linter and Vitest projects.
- [Releases](contributing/releases.md): semantic versioning, breaking changes, Conventional Commits and publishing a release.
- [Translations](../packages/translations/README.md): UI translation files and Crowdin workflow.
