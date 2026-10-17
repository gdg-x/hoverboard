# Manage data

Seed the emulator, check and fix Firestore documents, export subscribers as CSV, and import, export, pull or push content with `./hb data`.

**For:** [fork maintainers](../README.md#fork-maintainer), [returning organizers](../README.md#returning-organizer) and [content editors](../README.md#content-editor).

## Before you start

Without `--production`, `./hb data` commands connect to the running local Firestore emulator (started by `npm start` or `./hb emulators`) with the `demo-hoverboard` project, and never touch live data. Add `--production` to use the Firebase project in `packages/config/site.json`, signed in with `npx firebase login`.

Commands that write to production show what they will change and ask first. Pass `--yes` in CI, `--dry-run` to preview changes without writing, and `--json` for JSON output. See [CLI reference](../reference/cli.md).

## Seed the emulator

Import the sample data in `docs/sample-data` into the running Firestore emulator (or edit `docs/sample-data/collections/*.json` first to load your own data):

```console
./hb data seed
```

It only imports the collections of features that are on in `packages/config/site.json`. Documents with the same IDs are replaced, and documents that are already identical aren't written. `--dry-run` lists what it would add and change. To preview a specific stage of the demo event, pass `--stage <fixture>`; see [Run your event](run-your-event.md#see-where-you-are).

To import the sample data into production Firestore instead, run `./hb data seed --production`.

### Save emulator data across restarts

Save the running emulator's data to `.firebase/emulator-data` so `npm start` or `./hb emulators` reloads it automatically:

```console
./hb emulators save
```

Stopping `npm start` or `./hb emulators` cleanly (`Ctrl+C`) also saves to `.firebase/emulator-data`.

## Export collections as CSV

The subscribe band on the home page saves each visitor's email and name to `subscribers`, and the **Become a partner** form saves company leads to `potentialPartners`. Nobody can read either collection from the site. Export them as CSV for your mailing tool:

```console
./hb data export --csv --collection subscribers --collection potentialPartners --production
```

Writes one `.csv` file per collection (`subscribers.csv`), with an `id` column followed by every field. A subcollection's file joins its path with `--`, such as `partners--gold--items.csv`. Pass a folder to write them there instead of the current directory. Text starting with `=`, `+`, `-` or `@` gets a leading `'` so spreadsheets don't run it as a formula. Git ignores `.csv` files because they hold personal data.

## Export and import

```console
./hb data export --production
./hb data import hoverboard-export-2027-10-17T09-30-00.000Z
```

`data export` writes Firestore data to `hoverboard-export-<time>/` by default (see [Content model reference](../reference/content-model.md#export-format) for the folder layout):

- It exports the collections Hoverboard uses. `--all` adds other collections, such as ones from earlier versions.
- `--content` leaves out what visitors and functions write.
- `--collection speakers` exports only that collection (or `partners/*/items` or `partners/gold/items`), and can repeat.
- An export with visitor data holds emails, push tokens and user IDs. Keep it private, and don't commit it.

`data import` writes an export into Firestore:

- It first runs any data migrations an older export needs, and updates `site.json` when a migration does.
- It checks every content document and the schedule against the schema, and writes nothing when a document is invalid.
- It keeps existing documents that the export doesn't have, unless you pass `--replace`.
- Before replacing or deleting a document, it saves it to `.firebase/backups/<date>/` so the import can be undone; see [Backups](backups.md#backups-and-undo).
- `--collection` imports part of an export (migrations only run on a whole export).

To copy a collection to another project, export it, change `firebase.projectId`, and import it.

## Pull and push content

```console
./hb data pull
./hb data push --dry-run
./hb data push
```

`data pull` copies the live site's content into the running emulator so `npm start` shows it. `data push` copies the emulator's content to the live site, for example a schedule you prepared locally:

- Both make the content of the target match the source by exporting content and importing it with `--replace`.
- Only content moves: speakers, sessions, partners, team, tickets, videos, gallery, blog and previous speakers. Visitor and function data stays where it is.
- `--collection sessions` moves only that collection, and can repeat.
- Both save what they replace to `.firebase/backups/<date>/` first. `data push` pushes nothing when the emulator has no content.

## Check the data

```console
./hb data check --production
./hb data check --production --collection speakers
```

Reads every document, with subcollections, and checks it against the schema, checks the schedule, and checks that each session's speakers exist:

- Each problem names the document, field and value, and links to the document in the Firebase console.
- Problems in visitor data (`subscribers`, `featuredSessions`, etc.) are counted by collection without showing document IDs or values, since they can be emails, push tokens or user IDs.
- Problems in disabled features, retired collections, gallery photos without `alt`, and sample data documents in `--production` are reported as warnings.
- Problems that `--fix` can repair end with `(fixable)`.
- Exits with code `1` on any non-warning problem or pending migration.

## Fix the data

```console
./hb data check --production --fix --dry-run
./hb data check --production --fix
```

`--fix` backs up documents it will change to `.firebase/backups/<date>/`, runs pending [data migrations](upgrade.md#migrations), applies safe fixes, and checks the data again:

- Trims spaces and line breaks around links.
- Converts a reference where an ID belongs (`speakers/ada` to `ada`), a timestamp where a date belongs (in `event.timezone`), or numeric text where a number belongs.
- Removes retired fields (`extend` and `shortDescription` on sessions, `timezone` on `config/notifications`).
- Sets a missing `updatedAt` on push subscriptions to the time of the fix, removes `null` entries in `featuredSessions`, and deletes `subscribers` or `potentialPartners` documents without a valid email.

Each write only happens if the document hasn't changed since it was read. With `--collection`, only the safe fixes run, since migrations need every collection.

## See also

- [Backups](backups.md)
- [Upgrade](upgrade.md#migrations)
- [Content model reference](../reference/content-model.md)
- [CLI reference](../reference/cli.md)
