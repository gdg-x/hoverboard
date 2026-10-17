# Content model reference

Firestore collections, schemas, document kinds, and the folder format used by `./hb data export`, `./hb backup` and `docs/sample-data`.

## Schema and collection registry

Every Firestore collection Hoverboard uses is registered in [`packages/storage/collections.ts`](../../packages/storage/collections.ts) and described by the JSON Schema in [`packages/storage/schemas/firestore.schema.json`](../../packages/storage/schemas/firestore.schema.json).

`./hb data seed` and `./hb data import` validate every content document against the schema and write nothing when a document is invalid. Edits made in the Firebase console are not checked when saved; validate them with `./hb data check --production` (see [Manage data](../guides/manage-data.md#check-the-data)).

Each collection has a `kind`:

- `content`: written by organizers in the Firebase console or with `./hb data`. Read by the build and the browser.
- `visitor`: written by visitors from the site, checked by [`packages/storage/firestore.rules`](../../packages/storage/firestore.rules). Can hold personal data.
- `function`: written by organizers or Cloud Functions, read only by Cloud Functions.
- `cli`: written by `./hb` to record state such as completed migrations.

## Collections

| Path                       | Kind       | Features               | Holds                                                                                                     |
| -------------------------- | ---------- | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `blog`                     | `content`  | `blog`                 | Blog post metadata (`title`, `published`, `image`, `brief`, `content` or markdown file).                  |
| `gallery`                  | `content`  | `gallery`              | Event photos (`url`, `alt`, `order`).                                                                     |
| `partners`                 | `content`  | `partners`             | Partner tier groups (`title`, `order`).                                                                   |
| `partners/*/items`         | `content`  | `partners`             | Partner logos and links inside each tier (`name`, `logoUrl`, `url`, `order`).                             |
| `previousSpeakers`         | `content`  | `previousSpeakers`     | Speakers from earlier editions and their sessions by year.                                                |
| `sessions`                 | `content`  | `schedule`, `speakers` | Talks, workshops and breaks, including [schedule fields](../guides/schedule.md#sessions-on-the-schedule). |
| `speakers`                 | `content`  | `speakers`             | Speaker profiles (`name`, `photoUrl`, `bio`, `company`, `country`, `badges`, `socials`).                  |
| `team`                     | `content`  | `team`                 | Team groups (`title`).                                                                                    |
| `team/*/members`           | `content`  | `team`                 | Team members inside each group (`name`, `photoUrl`, `title`, `socials`).                                  |
| `tickets`                  | `content`  | `tickets`              | Ticket tiers, prices, `salesOpen`, `salesClose`, `soldOut` and purchase `url`.                            |
| `videos`                   | `content`  | `videos`               | Featured YouTube videos (`title`, `youtubeId`, `speakers`).                                               |
| `sessions/*/feedback`      | `visitor`  | `feedback`             | Per-user session ratings (`contentRating`, `styleRating`, `comment`).                                     |
| `featuredSessions`         | `visitor`  | `mySchedule`           | Saved session IDs per signed-in user (`featuredSessions/{userId}`).                                       |
| `profiles`                 | `visitor`  | `reactions`            | Public display name and photo chosen by users who react (`profiles/{userId}`).                            |
| `sessions/*/reactions`     | `visitor`  | `reactions`            | Per-user reactions to a session (`sessions/{sessionId}/reactions/{userId}`).                              |
| `notificationsUsers`       | `visitor`  | `notifications`        | Signed-in user's push tokens and My Schedule notification preference.                                     |
| `notificationsSubscribers` | `visitor`  | `notifications`        | Device push tokens subscribed to general notifications.                                                   |
| `subscribers`              | `visitor`  | `subscribe`            | Newsletter sign-ups (`email`, `firstName`, `lastName`).                                                   |
| `potentialPartners`        | `visitor`  | `partners`             | Partner inquiry form submissions (`email`, `fullName`, `companyName`).                                    |
| `config/notifications`     | `function` | `notifications`        | Optional notification `icon` URL read by Cloud Functions.                                                 |
| `notifications`            | `function` | `notifications`        | Outgoing general notifications queued for `sendGeneralNotification`.                                      |
| `sentNotifications`        | `function` | `notifications`        | Delivery log written by `scheduleNotifications` so a session reminder is sent once.                       |
| `config/migrations`        | `cli`      | —                      | Completed Firestore data migrations and timestamps.                                                       |

## External IDs and schedule fields

- `speakers` and `sessions` have optional `source` and `externalId` fields for data imported from an external tool (such as Sessionize), so a later import can match and update them instead of creating duplicates.
- A session's schedule and live stream fields (`day`, `startTime`, `endTime`, `track`, `stream`) are covered in [Schedule](../guides/schedule.md#sessions-on-the-schedule).

## Export format

`./hb data export`, `./hb backup create` and [`docs/sample-data/`](../sample-data/manifest.json) use the same folder format:

```text
hoverboard-export-2027-10-17T09-30-00.000Z/
  manifest.json
  collections/
    speakers.json
    sessions.json
    sessions--feedback.json
    partners--items.json
    config--notifications.json
```

- `manifest.json` records the Hoverboard version, `schemaVersion`, Firebase project, creation timestamp, the command that wrote the export, and each collection with its file name, document count, and whether it holds personal data.
- Each file in `collections/` holds one collection (or one `config` document), keyed by document path: `{ "speakers/ada": { "name": "Ada" } }`. A subcollection has one file across all parent documents, such as `partners--items.json`.
- Firestore timestamps, references, geopoints and bytes are serialized as `{ "$timestamp": "2027-10-15T09:00:00Z" }`, `{ "$reference": "speakers/ada" }`, `{ "$geopoint": [49.8, 23.9] }` and `{ "$bytes": "<base64>" }`. All other values are plain JSON so you can edit the files directly.

## See also

- [Schedule](../guides/schedule.md)
- [Content](../guides/content.md)
- [Manage data](../guides/manage-data.md)
- [Backups](../guides/backups.md)
