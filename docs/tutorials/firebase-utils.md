# Firestore Utils

At the moment Firestore admin panel doesn't allow to export/import data from their DB.
These scripts allow you to load data on your machine, edit and bring it back.
See examples to learn how it works.

By default all of these scripts run against the local [Firestore emulator](https://firebase.google.com/docs/emulator-suite) (started by `npm start` / `npm run start:emulators`), so they never touch your live project's data. To target **production** Firestore instead, add a `serviceAccount.json` file to the project root (see [02-firebase.md](02-firebase.md)) and use the `:production` variant of the script, e.g. `npm run firestore:init:production` or `npm run firestore:copy:production`.

⚠️ The emulator-targeted scripts connect to an already-running Firestore emulator — make sure `npm start` or `npm run start:emulators` is running in another terminal first. They automatically target the same project id your emulator is using (from `firebase use`), so data written by `firestore:init`/`firestore:copy` always shows up in the Emulator UI. Set `GCLOUD_PROJECT` to override this if needed.

## Seed the emulator with fixture data

Import the JSON fixtures in `docs/default-firebase-data.json` into the running Firestore emulator:

```console
    npm run firestore:init
```

[Optional] Edit `docs/default-firebase-data.json` first to load your own data.

## Export emulator data to prefill files

Once your emulator has the data you want (whether from `firestore:init`, the Emulator UI, or your app), export it to `.firebase/emulator-data` so it's automatically reloaded the next time you run `npm start` or `npm run start:emulators`:

```console
    npm run firestore:export
```

`npm run start:emulators` (and therefore `npm start`) also automatically exports to `.firebase/emulator-data` on a clean exit (`Ctrl+C`), so your data persists across restarts without running this manually.

## Save collection/doc to file

```console
    npm run firestore:copy sourcePath fileToSave.json
```

Examples:

Save a collection

```console
    npm run firestore:copy partners/1/items general-partners.json
```

Save a document

```console
    npm run firestore:copy partners/1/items/000 gdg-lviv-partner.json
```

## Load a file to collection/doc

```console
    npm run firestore:copy fileToLoad.json destinationPath
```

Examples:

Load to collection

```console
    npm run firestore:copy general-partners.json partners/1/items
```

Load a document

```console
    npm run firestore:copy gdg-lviv-partner.json partners/1/items/000
```

## Copy collection->collection or doc->doc

```console
    npm run firestore:copy sourcePath destinationPath
```

Examples:

Copy a collection

```console
    npm run firestore:copy speakers backups/08-07-2018/speakers
```

Copy a document

```console
    npm run firestore:copy speakers/yonatan_levin backups/08-07-2018/speakers/yonatan_levin
```
