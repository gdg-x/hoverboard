# Firestore Utils

At the moment Firestore admin panel doesn't allow to export/import data from their DB.
These scripts allow you to load data on your machine, edit and bring it back.
See examples to learn how it works.

By default all of these scripts run against the local [Firestore emulator](https://firebase.google.com/docs/emulator-suite) (started by `npm start` / `./hb emulators`), so they never touch your live project's data. To target **production** Firestore instead, set `FIRESTORE_TARGET=production`, e.g. `FIRESTORE_TARGET=production ./hb firestore-init` or `FIRESTORE_TARGET=production ./hb firestore-copy`. These sign in with your Firebase CLI login (`npx firebase login`) and use the project set as `firebase.projectId` in `packages/config/site.json`.

⚠️ The emulator-targeted scripts connect to an already-running Firestore emulator — make sure `npm start` or `./hb emulators` is running in another terminal first. They always use the `demo-hoverboard` project, like the emulators, so data written by `firestore-init`/`firestore-copy` always shows up in the Emulator UI.

## Content model

Event content (speakers, sessions, partners, team, tickets, videos, gallery, blog and previous speakers) follows the JSON Schema in [`packages/storage/schemas/firestore.schema.json`](../../packages/storage/schemas/firestore.schema.json), which also describes the data visitors and functions write. [`packages/storage/collections.ts`](../../packages/storage/collections.ts) lists every collection Hoverboard uses, with its schema and features. `firestore-init` and `firestore-copy` check every content document against it and write nothing when a document is invalid. Edits made in the Firebase console are not checked.

Speakers and sessions have optional `source` and `externalId` fields for data imported from another tool, so a later import can update them instead of adding duplicates.

A session is on the schedule with `day` (`YYYY-MM-DD`), `startTime` and `endTime` (`HH:MM` in `event.timezone`), and `track`, a track ID from `schedule.tracks` in `packages/config/site.json`. A session without `track` spans every track, such as a keynote or lunch. A session without a day and times isn't on the schedule yet, but shows on its own page and its speakers' pages. Two short talks in one slot are two sessions with their own times.

`firestore-init`, `firestore-copy` and the build check the schedule: each `track` must be in `site.json` and on the session's day, `endTime` must be after `startTime`, and sessions in one track can't overlap. The build fails and names the sessions.

Schedule edits show in the browser at once, and in the built pages after the next deploy, as for other content.

## Move the schedule onto the sessions

Before v4, a session's time and track came from where its ID was in the `schedule` collection, and functions copied the result into `generatedSchedule`, `generatedSessions` and `generatedSpeakers`. Hoverboard no longer reads these collections.

`convert-schedule` reads the `schedule` collection, and writes each session's day, times and track onto the session. It writes the tracks to `schedule.tracks` in `packages/config/site.json`.

```console
    ./hb convert-schedule --dry-run
    ./hb convert-schedule
```

- `--dry-run` prints the changes without writing them.
- A timeslot with several sessions in one track shares its time evenly between them, in whole minutes. Check those times afterwards.
- A session on the schedule more than once gets a copy for each extra time, such as `lunch-2`.
- A track that is only on some days gets those days in `days`.
- It leaves the `schedule` collection in place.

Check the schedule, deploy, then delete the old collections. `firestore:delete` takes one path at a time:

```console
    npx firebase firestore:delete --recursive schedule
    npx firebase firestore:delete --recursive generatedSchedule
    npx firebase firestore:delete --recursive generatedSessions
    npx firebase firestore:delete --recursive generatedSpeakers
```

Also delete the `config/schedule` document. `schedule.published` in `site.json` replaces it.

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
