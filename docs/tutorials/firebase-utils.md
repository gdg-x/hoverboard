# Firestore Utils

At the moment Firestore admin panel doesn't allow to export/import data from their DB.
These scripts allow you to load data on your machine, edit and bring it back.
See examples to learn how it works.

By default all of these scripts run against the local [Firestore emulator](https://firebase.google.com/docs/emulator-suite) (started by `npm start` / `./hbd emulators`), so they never touch your live project's data. To target **production** Firestore instead, set `FIRESTORE_TARGET=production`, e.g. `FIRESTORE_TARGET=production ./hbd firestore-init` or `FIRESTORE_TARGET=production ./hbd firestore-copy`. These sign in with your Firebase CLI login (`npx firebase login`) and use the project set as `firebase.projectId` in `packages/config/site.json`.

⚠️ The emulator-targeted scripts connect to an already-running Firestore emulator — make sure `npm start` or `./hbd emulators` is running in another terminal first. They always use the `demo-hoverboard` project, like the emulators, so data written by `firestore-init`/`firestore-copy` always shows up in the Emulator UI.

## Content model

Event content (speakers, sessions, schedule, partners, team, tickets, videos, gallery, blog and previous speakers) follows the JSON Schema in [`packages/storage/schemas/content.schema.json`](../../packages/storage/schemas/content.schema.json). `firestore-init` and `firestore-copy` check every content document against it and write nothing when a document is invalid. Edits made in the Firebase console are not checked.

Speakers and sessions have optional `source` and `externalId` fields for data imported from another tool, so a later import can update them instead of adding duplicates.

## Seed the emulator with fixture data

Import the JSON fixtures in `docs/default-firebase-data.json` into the running Firestore emulator:

```console
    ./hbd firestore-init
```

[Optional] Edit `docs/default-firebase-data.json` first to load your own data.

## Export emulator data to prefill files

Once your emulator has the data you want (whether from `firestore-init`, the Emulator UI, or your app), export it to `.firebase/emulator-data` so it's automatically reloaded the next time you run `npm start` or `./hbd emulators`:

```console
    ./hbd firestore-export
```

Starting the emulators (via `npm start` or `./hbd emulators`) also automatically exports to `.firebase/emulator-data` on a clean exit (`Ctrl+C`), so your data persists across restarts without running this manually.

## Save collection/doc to file

```console
    ./hbd firestore-copy sourcePath fileToSave.json
```

Examples:

Save a collection

```console
    ./hbd firestore-copy partners/1/items general-partners.json
```

Save a document

```console
    ./hbd firestore-copy partners/1/items/000 gdg-lviv-partner.json
```

## Load a file to collection/doc

```console
    ./hbd firestore-copy fileToLoad.json destinationPath
```

Examples:

Load to collection

```console
    ./hbd firestore-copy general-partners.json partners/1/items
```

Load a document

```console
    ./hbd firestore-copy gdg-lviv-partner.json partners/1/items/000
```

## Copy collection->collection or doc->doc

```console
    ./hbd firestore-copy sourcePath destinationPath
```

Examples:

Copy a collection

```console
    ./hbd firestore-copy speakers backups/08-07-2018/speakers
```

Copy a document

```console
    ./hbd firestore-copy speakers/yonatan_levin backups/08-07-2018/speakers/yonatan_levin
```
