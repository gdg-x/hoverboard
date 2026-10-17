# Features reference

Every feature flag in `features` in `packages/config/site.json`, its default, what it adds, what it requires, and how empty or archived features behave.

## Turning features on or off

Every feature is `true` by default in [`packages/web/defaults/site.json`](../../packages/web/defaults/site.json), except `demo` and `forkMe`. Override only the flags you change in `packages/config/site.json`:

```json
"features": {
  "previousSpeakers": false,
  "tickets": false
}
```

A feature that is `false` has no pages, navigation entry or home page block, and its client code is left out of the build.

## All features

| Feature            | Default | What it adds                                                                   | Needs                   | Guide                                                                             |
| ------------------ | ------- | ------------------------------------------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------- |
| `attending`        | `true`  | `/attending` page and home page links to it                                    | —                       | [Attending page](../guides/attending-page.md)                                     |
| `blog`             | `true`  | `/blog` list and post pages, home page blog band                               | `blog` documents        | [Content](../guides/content.md)                                                   |
| `codeOfConduct`    | `true`  | `/code-of-conduct` page                                                        | —                       | [Content](../guides/content.md#markdown-pages-faq-code-of-conduct-and-blog-posts) |
| `demo`             | `false` | Top banner to switch themes, density, color scheme, attendance and event clock | —                       | [`demo` and the dev bar](#demo)                                                   |
| `faq`              | `true`  | `/faq` page                                                                    | —                       | [Content](../guides/content.md#markdown-pages-faq-code-of-conduct-and-blog-posts) |
| `feedback`         | `true`  | Session rating and comment form during and after the event                     | `schedule`, `auth`      | [Run your event](../guides/run-your-event.md#after-the-event)                     |
| `forkMe`           | `false` | "Fork me on GitHub" sticker in the footer                                      | —                       | —                                                                                 |
| `functions`        | `true`  | Deploys Cloud Functions (requires Blaze plan; `false` runs on Spark)           | Blaze plan              | [Firebase project](../guides/firebase-project.md#billing)                         |
| `gallery`          | `true`  | Home page photo gallery band                                                   | `gallery` documents     | [Content](../guides/content.md)                                                   |
| `map`              | `true`  | Venue block on the home and attending pages (`false` required for `online`)    | `inPerson` or `hybrid`  | [Event details](../guides/event-details.md#venue-and-map)                         |
| `mySchedule`       | `true`  | Bookmark sessions, `/my-schedule` page, `.ics` calendar download               | `schedule`, `auth`      | [Schedule](../guides/schedule.md)                                                 |
| `notifications`    | `true`  | Notification bell, general notifications, My Schedule session reminders        | `functions`             | [Notifications](../guides/notifications.md)                                       |
| `partners`         | `true`  | Home page partners band and "Become a partner" form                            | `partners` documents    | [Content](../guides/content.md)                                                   |
| `previousSpeakers` | `true`  | `/previous-speakers` page and past talks on speaker pages                      | `previousSpeakers` docs | [Pages](../guides/pages.md)                                                       |
| `reactions`        | `true`  | Session reactions and public profiles                                          | `schedule`, `auth`      | [Reactions](../guides/reactions.md)                                               |
| `schedule`         | `true`  | `/schedule` and session pages, **On now** on the home page                     | `speakers`              | [Schedule](../guides/schedule.md)                                                 |
| `socialImages`     | `true`  | Generated social preview images for every speaker and session page             | —                       | [Share images](../guides/share-images.md)                                         |
| `speakers`         | `true`  | `/speakers` and speaker pages, home page speakers band                         | `speakers` documents    | [Content](../guides/content.md)                                                   |
| `subscribe`        | `true`  | Home page email subscribe band and footer link to it                           | —                       | [Manage data](../guides/manage-data.md#export-collections-as-csv)                 |
| `team`             | `true`  | `/team` page                                                                   | `team` documents        | [Pages](../guides/pages.md)                                                       |
| `tickets`          | `true`  | Home page tickets band and **Buy ticket** calls to action                      | `tickets` documents     | [Content](../guides/content.md)                                                   |
| `videos`           | `true`  | Home page featured videos band                                                 | `videos` documents      | [Content](../guides/content.md)                                                   |

## Dependencies and build checks

The build and `./hb config validate` fail when:

- A feature requires another feature that is `false`:
  - `schedule` requires `speakers`.
  - `mySchedule` and `feedback` require `schedule` (and at least one provider in `auth.providers`).
  - `notifications` requires `functions`.
- `event.attendance` is `online` and `map` is `true`.
- Event text in `content/resources.json` links to the page of a feature that is `false`, such as `/faq` in `footerRelBlock`.

When `feedback` is `false`, the feedback dialog component remains in the bundle, but nothing opens it. Save buttons appear only when `mySchedule` is `true`.

With `functions: true`, every Cloud Function deploys; when `notifications` or `mySchedule` is `false`, the corresponding function logs an error naming the `site.json` key and exits.

## Features without content

A feature that is `true` in `site.json` but has no documents in Firestore yet stays hidden so a new site never shows empty sections:

- `speakers` without speakers, `schedule` (and `mySchedule`) without `schedule.published: true` and scheduled sessions, and `blog`, `gallery`, `partners`, `previousSpeakers`, `team`, `tickets` and `videos` without documents hide their navigation entries, home page bands, and header/hero buttons.
- `/speakers` and `/schedule` still build and say they are coming soon, with a link to the subscribe band when `subscribe` is `true`.
- `./hb status` lists the features that are currently hidden because they have no content.

## `demo`

`demo` adds a bar across the top of every page where visitors can try the built-in themes, spacing (`compact`, `default`, `roomy`), color scheme (`light` or `dark`), attendance mode (`inPerson`, `hybrid`, `online`), and an event clock that jumps to any date and time at the event. Leave `demo` set to `false` on a real event's site.

On the local emulators (`npm start` and `npm run serve`), every site shows this bar automatically—labeled `DEV` instead of `DEMO`—so you can preview themes and event stages locally before deploying. See [Run your event](../guides/run-your-event.md#see-where-you-are).

## Header and footer controls

- **Next-step call to action:** the header shows the first next step for the current stage, and the home page hero shows the first two (a hybrid event's header skips the stream link so venue attendees see the schedule or attending info first). See [Run your event](../guides/run-your-event.md).
- **Account button:** shows when `mySchedule`, `feedback` or `reactions` is `true`.
- **Notifications bell:** shows when `notifications` is `true`.
- **Footer subscribe link:** shows when `subscribe` is `true`.
- **Fork me sticker:** shows when `forkMe` is `true`.

## Archived editions

When `archive` is set in `packages/config/site.json`, the site is a read-only archive of a past edition. An archived build requires `blog`, `demo`, `feedback`, `forkMe`, `functions`, `mySchedule`, `notifications` and `subscribe` to be `false`, hides the partner form and sign-in, and shows a banner linking to `archive.current`. The build fails if any of those features is `true`. See [Next edition](../guides/next-edition.md#manage-the-archives).

## See also

- [Configuration reference](configuration.md)
- [Run your event](../guides/run-your-event.md)
- [CLI reference](cli.md)
