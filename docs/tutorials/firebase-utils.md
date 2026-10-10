# Firestore Utils

At the moment Firestore admin panel doesn't allow to export/import data from their DB.
These scripts allow you to load data on your machine, edit and bring it back.
See examples to learn how it works.

By default all of these scripts run against the local [Firestore emulator](https://firebase.google.com/docs/emulator-suite) (started by `npm start` / `./hb emulators`), so they never touch your live project's data. To target **production** Firestore instead, set `FIRESTORE_TARGET=production`, e.g. `FIRESTORE_TARGET=production ./hb firestore-init` or `FIRESTORE_TARGET=production ./hb firestore-copy`. These sign in with your Firebase CLI login (`npx firebase login`) and use the project set as `firebase.projectId` in `packages/config/site.json`.

⚠️ The emulator-targeted scripts connect to an already-running Firestore emulator — make sure `npm start` or `./hb emulators` is running in another terminal first. They always use the `demo-hoverboard` project, like the emulators, so data written by `firestore-init`/`firestore-copy` always shows up in the Emulator UI.

## Content model

Event content (speakers, sessions, partners, team, tickets, videos, gallery, blog and previous speakers) follows the JSON Schema in [`packages/storage/schemas/firestore.schema.json`](../../packages/storage/schemas/firestore.schema.json), which also describes the data visitors and functions write. [`packages/storage/collections.ts`](../../packages/storage/collections.ts) lists every collection Hoverboard uses, with its schema and features. `firestore-init` and `firestore-copy` check every content document against it and write nothing when a document is invalid. Edits made in the Firebase console are not checked as you make them. Check them with [`firestore-check`](#check-the-data).

Speakers and sessions have optional `source` and `externalId` fields for data imported from another tool, so a later import can update them instead of adding duplicates.

A session is on the schedule with `day` (`YYYY-MM-DD`), `startTime` and `endTime` (`HH:MM` in `event.timezone`), and `track`, a track ID from `schedule.tracks` in `packages/config/site.json`. A session without `track` spans every track, such as a keynote or lunch. A session without a day and times isn't on the schedule yet, but shows on its own page and its speakers' pages. Two short talks in one slot are two sessions with their own times.

A session's `stream` is the `https:` link to watch it live. Without one, it uses its track's `stream` in `site.json`, then `event.stream` for an online or hybrid event. From 10 minutes before the start until the end, the session page shows **Watch live**, the schedule marks the session **Live**, and calendar links include the stream.

`firestore-init`, `firestore-copy` and the build check the schedule: each `track` must be in `site.json` and on the session's day, `endTime` must be after `startTime`, and sessions in one track can't overlap. The build fails and names the sessions.

Schedule edits show in the browser at once, and in the built pages after the next deploy, as for other content.

## Check the data

```console
    FIRESTORE_TARGET=production ./hb firestore-check
    FIRESTORE_TARGET=production ./hb firestore-check --collection speakers
```

Reads every document, with subcollections, and checks it against the schema. It also checks the schedule, and that each session's speakers exist. Without `FIRESTORE_TARGET=production`, it reads the emulator. Without `--fix`, it doesn't change anything.

- Each problem names the document, the field and the value, and links to the document in the Firebase console.
- Problems in the data visitors write, such as `subscribers`, are counted by collection. Their document IDs and values are left out, since they can be emails, push tokens or user IDs.
- Problems in the content of a feature that is off are warnings. So are collections from earlier versions, with the command that deletes them, and collections Hoverboard doesn't use.
- Problems that `--fix` can fix end with "(fixable)".
- It exits with an error when it finds a problem that isn't a warning, or a migration that hasn't run. In GitHub Actions, problems are annotations.

## Fix the data

```console
    FIRESTORE_TARGET=production ./hb firestore-check --fix --dry-run
    FIRESTORE_TARGET=production ./hb firestore-check --fix
```

`--fix` runs the data migrations that haven't run, then the safe fixes, then checks the data again. `--dry-run` shows the changes without writing them. Against production, it asks before it writes. Without a terminal to ask in, such as in CI, it needs `--yes`.

The safe fixes are:

- Spaces and line breaks around a link are removed.
- A reference where an ID belongs, such as a session's speaker, becomes the ID: `ada` for `speakers/ada`.
- A timestamp where a date belongs becomes the date in `event.timezone`.
- Text that is a number, where a number belongs, becomes the number.
- Fields Hoverboard stopped reading, such as `extend` and `shortDescription` on sessions and `timezone` on `config/notifications`, are removed.
- A missing `updatedAt`, such as on push subscriptions from before the rules required it, is set to the time of the fix.
- A `subscribers` or `potentialPartners` document without a valid email is deleted, since nobody can answer it. These are usually tests and spam.
- A `null` entry in `featuredSessions`, which older sites wrote for a session that was unsaved, is removed. The site removes the entry now.

Other problems need an edit in the Firebase console. What visitors wrote is never changed: their data only gets the three fixes above, which add a missing time, drop empty saved sessions or delete the whole document. The plan counts those documents by collection, without their IDs, since they can be push tokens or user IDs.

Each write only happens if the document hasn't changed since it was read. A document someone edited in the meantime is left alone and named. Run `--fix` again for it.

With `--collection`, only the fixes run, since the migrations need every document.

### Migrations

A migration moves data from the shape of an older version to the current one. `config/migrations` records the ones that ran, with when and how many documents they changed.

`4.0.0-schedule-on-sessions` runs when the `schedule` collection has days and no session has a day. Before v4, a session's time and track came from where its ID was in `schedule`, and functions copied the result into `generatedSchedule`, `generatedSessions` and `generatedSpeakers`. Hoverboard no longer reads these collections. The migration writes each session's day, times and track onto the session, and the tracks to `schedule.tracks` in `packages/config/site.json`.

- A timeslot with several sessions in one track shares its time evenly between them, in whole minutes. Check those times afterwards.
- A session on the schedule more than once gets a copy for each extra time, such as `lunch-2`.
- A track that is only on some days gets those days in `days`.
- It leaves the `schedule` collection in place.

Commit the change to `site.json`, check the schedule and deploy. Then delete the old collections. `firestore-check` lists them with the command for each. Until the migration runs, it says to keep `schedule` instead, since the times are only there. The `generated*` collections can go at any time.

Also delete the `config/schedule` document. `schedule.published` in `site.json` replaces it.

`4.0.0-sign-up-ids` runs when a `subscribers` or `potentialPartners` document has the email as its ID. Before v4, the site saved sign-ups with the email, without its punctuation, as the ID, so the email showed in every link to them. The migration copies each one to a random ID, as the site writes them now, and deletes the old document in the same write. The plan shows only how many move, not the emails.

### Backups and undo

Before it changes a document, `--fix` saves it as it was in `.firebase/backups/<date>/documents.json`. Git ignores the folder. To undo a fix:

```console
    FIRESTORE_TARGET=production ./hb firestore-check --restore .firebase/backups/<date>
```

It writes back each document as it was, and deletes the session copies the migration created. Edits made since the fix are lost in those documents. It doesn't undo the change to `site.json`. Use `git checkout packages/config/site.json` for that.

Backups hold your content, and the visitor documents a fix changed or deleted, such as push tokens and emails. `./hb doctor` warns about backups older than 30 days. Delete them once the fixes are checked.

## Seed the emulator with fixture data

Import the JSON fixtures in `docs/default-firebase-data.json` into the running Firestore emulator:

```console
    ./hb firestore-init
```

[Optional] Edit `docs/default-firebase-data.json` first to load your own data.

It only imports the data of features that are on in `packages/config/site.json`. For example, with `blog` off it skips `blog`, and with `schedule` and `speakers` both off it skips `sessions`. The `config/notifications` document needs `notifications`.

## Export emulator data to prefill files

Once your emulator has the data you want (whether from `firestore-init`, the Emulator UI, or your app), export it to `.firebase/emulator-data` so it's automatically reloaded the next time you run `npm start` or `./hb emulators`:

```console
    ./hb firestore-export
```

Starting the emulators (via `npm start` or `./hb emulators`) also automatically exports to `.firebase/emulator-data` on a clean exit (`Ctrl+C`), so your data persists across restarts without running this manually.

## Export a collection as CSV

```console
    FIRESTORE_TARGET=production ./hb firestore-csv subscribers
```

Writes `subscribers.csv`, with one row per document: an `id` column, then every field. Pass a file name after the collection to write somewhere else. Without `FIRESTORE_TARGET=production`, it reads the emulator. Text that starts with `=`, `+`, `-` or `@` gets a `'` in front, so a spreadsheet shows it instead of running it as a formula. Git ignores `.csv` files, since these hold personal data.

## Save collection/doc to file

```console
    ./hb firestore-copy sourcePath fileToSave.json
```

Examples:

Save a collection

```console
    ./hb firestore-copy partners/1/items general-partners.json
```

Save a document

```console
    ./hb firestore-copy partners/1/items/000 gdg-lviv-partner.json
```

## Load a file to collection/doc

```console
    ./hb firestore-copy fileToLoad.json destinationPath
```

Examples:

Load to collection

```console
    ./hb firestore-copy general-partners.json partners/1/items
```

Load a document

```console
    ./hb firestore-copy gdg-lviv-partner.json partners/1/items/000
```

## Copy collection->collection or doc->doc

```console
    ./hb firestore-copy sourcePath destinationPath
```

Examples:

Copy a collection

```console
    ./hb firestore-copy speakers backups/08-07-2018/speakers
```

Copy a document

```console
    ./hb firestore-copy speakers/yonatan_levin backups/08-07-2018/speakers/yonatan_levin
```
