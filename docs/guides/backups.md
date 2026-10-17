# Backups

Back up and restore your Firestore documents and Firebase Auth users, undo changes from imports or fixes, and schedule automated database backups.

**For:** [fork maintainers](../README.md#fork-maintainer).

## Backups and undo

Before `./hb data check --fix`, `./hb data import` or `./hb backup restore` changes or deletes a document, it saves the previous version in `.firebase/backups/<date>/`, in the [export format](../reference/content-model.md#export-format). Git ignores `.firebase/backups/`.

To undo a fix or an import, restore that backup:

```console
./hb backup restore .firebase/backups/<date> --production
```

It writes back each document as it was, and deletes documents the fix or import created, such as the session copies a migration makes. Edits made since are lost in those documents. It doesn't undo a change to `packages/config/site.json`; use `git checkout packages/config/site.json` for that.

Backups hold your content and any visitor documents a fix changed or deleted, such as push tokens and emails. `./hb doctor` warns about backups in `.firebase/backups` older than 30 days. Delete them once your changes are checked. See [Security](security.md).

## Back up and restore

```console
./hb backup create --production
./hb backup list --production
./hb backup restore .firebase/backups/<date> --production
```

- `backup create` saves every Firestore document, including collections Hoverboard doesn't use, to `.firebase/backups/<date>/`. On `--production`, it also saves the Auth users to `auth/users.json` with `firebase auth:export`. `--no-auth` leaves them out. The emulator's users aren't backed up. Keep backups private, as they contain personal data.
- `backup list` shows the backups in `.firebase/backups`: the full ones from `backup create`, and the change backups that `--fix`, `data import` and `backup restore` saved. With `--production`, it also shows the scheduled backups in Firestore and whether point-in-time recovery is on.
- `backup restore` takes a backup's folder, or its name in `.firebase/backups`:
  - Writes the documents back as they are, without migrations or schema checks.
  - A full backup replaces the collections it has (documents added since are deleted). A backup of changes writes back what changed and deletes what the change created.
  - Shows what it will write and delete, and saves what it replaces first, so the restore itself can be undone. `--dry-run` only shows it.
  - On `--production`, adds the Auth users the project no longer has. Users that still exist are kept, unless you pass `--overwrite-users`, which saves them first. Users with a password are left out, since importing them needs the project's password hash settings (verify): import them with `npx firebase auth:import` and the `--hash-algo` options from the Firebase console. `--no-auth` skips the users.

## Scheduled backups

Firestore can back up the production database on a schedule and keep each backup for a retention period. Scheduled backups require the [Blaze plan](firebase-project.md#billing) and are billed for storage, with no free tier ([Firestore pricing](https://firebase.google.com/docs/firestore/pricing)).

```console
./hb backup schedule --daily
./hb backup schedule --weekly monday --retention 56 --pitr
./hb backup schedule --disable
```

- `--daily` keeps each backup 7 days, and `--weekly` 28 days, on Sunday unless you name a day. `--retention` sets the days: up to 7 for daily backups, and 98 for weekly ones (verify).
- `--pitr` also turns on point-in-time recovery, which keeps every version of the data for 7 days.
- Keeps a schedule that already matches, and replaces the others. `--disable` deletes the schedules and turns point-in-time recovery off.
- Always uses the project in `packages/config/site.json`, shows the change and asks first. `--dry-run` only shows it.

`./hb doctor` warns when the production project has no backup schedule.

Firestore restores a scheduled backup into a new database, not the one the site uses. `./hb backup restore projects/<project>/locations/<location>/backups/<id>` prints the steps, using the backup names from `./hb backup list --production` (verify).

## See also

- [Manage data](manage-data.md)
- [Security](security.md)
- [Next edition](next-edition.md)
- [CLI reference](../reference/cli.md)
