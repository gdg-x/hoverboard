# Firestore Utils

The `./hb data` commands seed, check, fix, export, import, pull and push the site's Firestore data, and the `./hb backup` commands back it up and restore it. See the examples below.

They use the local [Firestore emulator](https://firebase.google.com/docs/emulator-suite) (started by `npm start` or `./hb emulators`), so they never touch your live project's data. Add `--production` to use production Firestore instead, for example `./hb data seed --production`. It signs in with your Firebase CLI login (`npx firebase login`) and uses the project set as `firebase.projectId` in `packages/config/site.json`.

Commands that write to production show what they will change and ask first. Without a terminal to ask in, such as in CI, they need `--yes`. `--dry-run` shows the changes without writing them. `--json` prints the result as JSON, for scripts.

⚠️ Without `--production`, the commands connect to an already-running Firestore emulator. Make sure `npm start` or `./hb emulators` is running in another terminal first. They always use the `demo-hoverboard` project, like the emulators, so data written by `data seed` and `data import` always shows up in the Emulator UI.

## Content model

Event content (speakers, sessions, partners, team, tickets, videos, gallery, blog and previous speakers) follows the JSON Schema in [`packages/storage/schemas/firestore.schema.json`](../../packages/storage/schemas/firestore.schema.json), which also describes the data visitors and functions write. [`packages/storage/collections.ts`](../../packages/storage/collections.ts) lists every collection Hoverboard uses, with its schema and features. `data seed` and `data import` check every content document against it and write nothing when a document is invalid. Edits made in the Firebase console are not checked as you make them. Check them with [`data check`](#check-the-data).

Speakers and sessions have optional `source` and `externalId` fields for data imported from another tool, so a later import can update them instead of adding duplicates.

A session is on the schedule with `day` (`YYYY-MM-DD`), `startTime` and `endTime` (`HH:MM` in `event.timezone`), and `track`, a track ID from `schedule.tracks` in `packages/config/site.json`. A session without `track` spans every track, such as a keynote or lunch. A session without a day and times isn't on the schedule yet, but shows on its own page and its speakers' pages. Two short talks in one slot are two sessions with their own times.

A session's `stream` is the `https:` link to watch it live. Without one, it uses its track's `stream` in `site.json`, then `event.stream` for an online or hybrid event. From 10 minutes before the start until the end, the session page shows **Watch live**, the schedule marks the session **Live**, and calendar links include the stream.

On the event's days, the home page shows **On now** below the hero: the sessions that are on, with their links to watch live, and the ones that start in the next 30 minutes. It hides itself between sessions with nothing coming up. It needs `schedule`, and `schedule.published`.

`data seed`, `data import` and the build check the schedule: each `track` must be in `site.json` and on the session's day, `endTime` must be after `startTime`, and sessions in one track can't overlap. The build fails and names the sessions.

Schedule edits show in the browser at once, and in the built pages after the next deploy, as for other content.

## Check the data

```console
./hb data check --production
./hb data check --production --collection speakers
```

Reads every document, with subcollections, and checks it against the schema. It also checks the schedule, and that each session's speakers exist. Without `--production`, it reads the emulator. Without `--fix`, it doesn't change anything.

- Each problem names the document, the field and the value, and links to the document in the Firebase console.
- Problems in the data visitors write, such as `subscribers`, are counted by collection. Their document IDs and values are left out, since they can be emails, push tokens or user IDs.
- Problems in the content of a feature that is off are warnings. So are collections from earlier versions, with the command that deletes them, and collections Hoverboard doesn't use.
- Gallery photos without `alt` are warnings, since screen readers only hear "Gallery photo".
- With `--production`, documents from the sample data are warnings, counted by collection, since visitors see them.
- Problems that `--fix` can fix end with "(fixable)".
- It exits with an error when it finds a problem that isn't a warning, or a migration that hasn't run. In GitHub Actions, problems are annotations.

## Fix the data

```console
./hb data check --production --fix --dry-run
./hb data check --production --fix
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

Commit the change to `site.json`, check the schedule and deploy. Then delete the old collections. `data check` lists them with the command for each. Until the migration runs, it says to keep `schedule` instead, since the times are only there. The `generated*` collections can go at any time.

Also delete the `config/schedule` document. `schedule.published` in `site.json` replaces it.

`4.0.0-sign-up-ids` runs when a `subscribers` or `potentialPartners` document has the email as its ID. Before v4, the site saved sign-ups with the email, without its punctuation, as the ID, so the email showed in every link to them. The migration copies each one to a random ID, as the site writes them now, and deletes the old document in the same write. The plan shows only how many move, not the emails.

### Backups and undo

Before it changes a document, `--fix` saves it as it was in `.firebase/backups/<date>/`, in the [export format](#export-and-import). `data import` and `backup restore` do the same before they replace or delete documents. Git ignores the folder. To undo a fix or an import:

```console
./hb backup restore .firebase/backups/<date> --production
```

It writes back each document as it was, and deletes the documents the fix or import created, such as the session copies a migration makes. Edits made since are lost in those documents. It doesn't undo a change to `site.json`. Use `git checkout packages/config/site.json` for that. See [Back up and restore](#back-up-and-restore).

Backups hold your content, and the visitor documents a fix changed or deleted, such as push tokens and emails. `./hb doctor` warns about backups older than 30 days. Delete them once the fixes are checked.

## Seed the emulator with sample data

Import the sample data in `docs/sample-data` into the running Firestore emulator:

```console
./hb data seed
```

The sample data is an export, in the [export format](#export-and-import). [Optional] Edit the files in `docs/sample-data/collections` first to load your own data.

It only imports the data of features that are on in `packages/config/site.json`. For example, with `blog` off it skips `blog`, and with `schedule` and `speakers` both off it skips `sessions`. The `config/notifications` document needs `notifications`. Documents with the same IDs are replaced, and documents that are already the same aren't written. `--dry-run` lists what it would add and change in each collection.

## Export emulator data to prefill files

Once your emulator has the data you want (whether from `data seed`, the Emulator UI, or your app), save it to `.firebase/emulator-data` so it's automatically reloaded the next time you run `npm start` or `./hb emulators`:

```console
./hb emulators save
```

Starting the emulators (via `npm start` or `./hb emulators`) also automatically exports to `.firebase/emulator-data` on a clean exit (`Ctrl+C`), so your data persists across restarts without running this manually.

## Export collections as CSV

```console
./hb data export --csv --collection subscribers --production
```

Writes `subscribers.csv`, with one row per document: an `id` column, then every field. Repeat `--collection` for more collections, each in its own file. A subcollection's file joins its path with `--`, such as `partners--gold--items.csv`. Pass a folder to write them there instead of the current folder. Without `--production`, it reads the emulator. Text that starts with `=`, `+`, `-` or `@` gets a `'` in front, so a spreadsheet shows it instead of running it as a formula. Git ignores `.csv` files, since these hold personal data.

## Export and import

```console
./hb data export --production
./hb data import hoverboard-export-2027-10-17T09-30-00.000Z
```

`data export` writes the data to a folder, `hoverboard-export-<time>` by default:

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

- `manifest.json` has the Hoverboard version, `schemaVersion`, the project, the time, the command that wrote it, and each collection with its file and number of documents. It marks the files that hold personal data, such as `subscribers`.
- Each file holds one collection, or one `config` document, by document path: `{ "speakers/ada": { "name": "Ada" } }`. A subcollection has one file for all its parents, such as `partners--items.json` for the partners of every group.
- Timestamps, references, geopoints and bytes are kept as `{ "$timestamp": "2027-10-15T09:00:00Z" }`, `{ "$reference": "speakers/ada" }`, `{ "$geopoint": [49.8, 23.9] }` and `{ "$bytes": "<base64>" }`. Everything else is plain JSON, so you can edit the files.
- It exports the collections Hoverboard uses. `--all` adds the others, such as collections from earlier versions. `--content` leaves out what visitors and functions write. `--collection speakers` exports only that collection, and can repeat. A subcollection is `partners/*/items`, or one group's, `partners/gold/items`.

An export with visitor data holds emails, push tokens and user IDs. Keep it private, and don't commit it.

`data import` writes an export into Firestore:

- It first runs the data migrations an older export needs, as `data check --fix` does, and changes `site.json` when a migration does.
- It checks every content document, and the schedule, and writes nothing when one is invalid.
- It shows what it will add, change and leave as it is, by collection. Against production, it asks first.
- It keeps the documents the export doesn't have. `--replace` deletes them, in the collections it imports, or with `--collection`, in the ones it names.
- Before it replaces or deletes a document, it saves it as it was, so the import can be [undone](#backups-and-undo).
- `--collection` imports part of an export. Migrations only run on a whole export, since they need every document.

To copy a collection to another project, export it, change `firebase.projectId`, and import it.

## Pull and push content

```console
./hb data pull
./hb data push --dry-run
./hb data push
```

`data pull` copies the live site's content into the running emulator, so `npm start` shows it. `data push` copies the emulator's content to the live site, for example a schedule you prepared and checked locally.

- Both make the content of one side the same as the other's: they add, change and delete documents. They export the content, then [import](#export-and-import) it with `--replace`, so the import's checks and backups apply.
- Only content moves: speakers, sessions, partners, team, tickets, videos, gallery, blog and previous speakers. What visitors and functions write stays where it is.
- `--collection sessions` moves only that collection, and can repeat.
- `data push` shows what it will add, change and delete on the live site, by collection, and asks first. It saves what it replaces, so the push can be [undone](#backups-and-undo). It pushes nothing when the emulator has no content.
- `data pull` saves what it replaces in the emulator too.

## Back up and restore

```console
./hb backup create --production
./hb backup list --production
./hb backup restore .firebase/backups/<date> --production
```

`backup create` saves every Firestore document, including collections Hoverboard doesn't use, to `.firebase/backups/<date>/` in the [export format](#export-and-import). On production, it also saves the Auth users to `auth/users.json` with `firebase auth:export`. `--no-auth` leaves them out. The emulator's users aren't backed up. The backup holds personal data, such as emails and push tokens. Keep it private.

`backup list` shows the backups in `.firebase/backups`: the full ones from `backup create`, and the changes that `--fix`, `data import` and `backup restore` saved. With `--production`, it also shows the scheduled backups in Firestore, and whether point-in-time recovery is on.

`backup restore` takes a backup's folder, or its name in `.firebase/backups`:

- It writes the documents back as they are, without migrations or checks.
- A full backup replaces the collections it has: documents added since are deleted. A backup of changes writes back what changed, and deletes what the change created.
- It shows what it will write and delete, and saves what it replaces first, so the restore can be undone too. `--dry-run` only shows it.
- On production, it adds the Auth users the project no longer has. Users that still exist are kept, unless `--overwrite-users`, which saves them first. Users with a password are left out, since importing them needs the project's password hash settings (verify): import them with `npx firebase auth:import` and the `--hash-algo` options from the Firebase console. `--no-auth` skips the users.

### Scheduled backups

Firestore can back up the production database on a schedule, and keep each backup for a time. It needs the Blaze plan. Backups and point-in-time recovery are billed for storage, with no free usage ([pricing](https://firebase.google.com/docs/firestore/pricing)).

```console
./hb backup schedule --daily
./hb backup schedule --weekly monday --retention 56 --pitr
./hb backup schedule --disable
```

- `--daily` keeps each backup 7 days, and `--weekly` 28 days, on Sunday unless you name a day. `--retention` sets the days: up to 7 for daily backups, and 98 for weekly ones (verify).
- `--pitr` also turns on point-in-time recovery, which keeps every version of the data for 7 days.
- It keeps a schedule that already matches, and replaces the others. `--disable` deletes the schedules and turns point-in-time recovery off.
- It always uses the project in `site.json`, shows the change and asks first. `--dry-run` only shows it.

`./hb doctor` warns when the project has no schedule.

Firestore restores a scheduled backup into a new database, not the one the site uses. `./hb backup restore projects/<project>/locations/<location>/backups/<id>` prints the steps, with the backup names from `backup list --production` (verify).
