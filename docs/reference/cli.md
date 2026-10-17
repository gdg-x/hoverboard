# CLI reference

Every `./hb` command, shared flags, exit codes, npm scripts, and `FIRESTORE_TARGET`.

## Shared flags and exit codes

Commands that read or write Firestore use the local emulator by default (`demo-hoverboard`), or the Firebase project in `packages/config/site.json` when you pass `--production`.

| Flag           | Applies to                                                                            | Description                                                                   |
| -------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `--production` | `status`, `data`, `backup`, `edition feedback`, `upgrade --migrations-only`, `notify` | Use the Firebase project in `site.json` instead of the emulator.              |
| `--dry-run`    | Commands that write                                                                   | Show what would change without writing anything.                              |
| `-y, --yes`    | Commands that write to production                                                     | Skip the confirmation prompt (required when running without a TTY, as in CI). |
| `--json`       | Every `./hb` command                                                                  | Print the result as a single JSON object on `stdout`, and logs on `stderr`.   |

Exit codes:

- `0`: succeeded.
- `1`: a check failed or an error occurred.
- `2`: usage error (invalid flags or arguments).

## Setup and status commands

### `hb init`

Set up a site interactively or from flags. Safe to run again; current values are the defaults.

```console
./hb init [options]
```

What `./hb init` does:

1. Signs you in to Firebase and creates or picks your Firebase project, adding a web app if needed.
1. Copies `packages/demo-config` to `packages/config` the first time, replaces the demo's text with starter text for your event, and asks for your event's details, hero descriptions, ticket details, theme and features.
1. Copies your logo, app icon and share image into `packages/config/public/images`.
1. Checks that the project is on the Blaze plan (when `functions` is on) and prints spend cap instructions.
1. Creates the Firestore database in the location you pick, near your visitors (the location cannot change later).
1. Starts with empty collections, or imports the sample data (`--seed`) or an export such as last year's site (`--from <folder>`).
1. Offers daily scheduled backups on the Blaze plan, and the first deploy.
1. In a clone of Hoverboard with `gh` signed in, offers to create a private GitHub repository, push to it, rename the Hoverboard remote to `upstream`, and run `./hb setup-github`.
1. Ends with `./hb doctor`, the live site URL and console links.

| Option                             | Description                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `--project <id>`                   | Firebase project ID.                                                                       |
| `--create`                         | Create `--project` instead of using an existing project.                                   |
| `--details <file>`                 | Read answers from a JSON file instead of prompting (can include a `resources` object).     |
| `--deploy`, `--no-deploy`          | Deploy or skip the deploy without asking.                                                  |
| `--seed`, `--no-seed`              | Import sample data or start with empty collections without asking.                         |
| `--from <export>`                  | Import content from an export folder instead of sample data.                               |
| `--location <id>`                  | Firestore location ID when creating the database, such as `eur3`.                          |
| `--logo <file>`                    | Copy an SVG into `packages/config/public/images/logo.svg` and remove the demo's dark logo. |
| `--icon <file>`                    | Copy a square PNG (at least 512×512) or SVG as the app icon.                               |
| `--share-image <file>`             | Copy a JPEG or PNG as the link preview image.                                              |
| `--repo <owner/name>`, `--no-repo` | Create a private GitHub repository or skip repository creation.                            |
| `--backups`, `--no-backups`        | Schedule daily backups or skip without asking.                                             |

### `hb doctor`

Check that your computer, Firebase project and GitHub repository are ready:

```console
./hb doctor
```

What `./hb doctor` checks:

- Node.js version, Firebase CLI login, selected project and `packages/config` validation.
- Demo leftovers in `packages/config`: demo images, text, highlights video and social links.
- No service account key files in the repository root.
- The Blaze plan (when `functions` is on), and that every deployed function is 2nd gen (and none are left over when `functions` is off).
- The Realtime Database is off.
- The GitHub Actions Workload Identity Federation setup and service account roles, as `./hb setup-github` configures them.
- Service account keys and old `github-action-*` accounts in Google Cloud.
- The Firebase web app's browser API key and the Google Maps API key: allowed HTTP referrers and APIs.
- Local backups in `.firebase/backups` older than 30 days.
- A Firestore backup schedule on the production database.

### `hb status`

Show the Firebase project, site URL, versions, enabled and hidden features, last deploy, files changed outside `packages/config`, document counts per collection, and the current and next event stages:

```console
./hb status [--production]
```

### `hb setup`

Log in to Firebase, write `.firebaserc` from `firebase.projectId` in `packages/config/site.json`, and run `./hb doctor`:

```console
./hb setup
```

### `hb setup-github`

Configure Workload Identity Federation and a least-privilege `github-deploy` service account so GitHub Actions can deploy without service account keys. See [Deploy](../guides/deploy.md#deploying-to-firebase-with-github-actions).

```console
./hb setup-github [--repo <owner/name>] [--project <id>] [--dry-run]
```

## Deploy, config and emulator commands

| Command                  | Target     | Description                                                                                               |
| ------------------------ | ---------- | --------------------------------------------------------------------------------------------------------- |
| `./hb deploy`            | Production | Check content, build from production Firestore and deploy to `firebase.projectId` (`--dry-run`, `--yes`). |
| `./hb deploy-args`       | Local      | Print the `firebase deploy` arguments for `site.json` (used by `deploy.yaml`).                            |
| `./hb config validate`   | Local      | Validate `packages/config` against the JSON Schemas, the same way the build does.                         |
| `./hb config project-id` | Local      | Print `firebase.projectId` for workflows; fails on the demo config unless `HB_DEMO=true`.                 |
| `./hb emulators [start]` | Emulator   | Start the local Firebase emulators with data from `.firebase/emulator-data`.                              |
| `./hb emulators save`    | Emulator   | Save the running Firestore emulator's data to `.firebase/emulator-data`.                                  |
| `./hb audit-deps`        | Local      | Fail on high or critical advisories in production dependencies.                                           |

## `hb data`

See [Manage data](../guides/manage-data.md) for usage examples.

| Command                     | Target                     | Options                                                                   |
| --------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| `./hb data seed`            | Emulator or `--production` | `--stage <fixture>`, `--dry-run`, `-y, --yes`                             |
| `./hb data import <folder>` | Emulator or `--production` | `--collection <path>` (repeatable), `--replace`, `--dry-run`, `-y, --yes` |
| `./hb data export [folder]` | Emulator or `--production` | `--collection <path>` (repeatable), `--content`, `--all`, `--csv`         |
| `./hb data pull`            | Production → Emulator      | `--collection <path>` (repeatable), `--dry-run`                           |
| `./hb data push`            | Emulator → Production      | `--collection <path>` (repeatable), `--dry-run`, `-y, --yes`              |
| `./hb data check`           | Emulator or `--production` | `--collection <path>`, `--fix`, `--dry-run`, `-y, --yes`                  |

## `hb backup`

See [Backups](../guides/backups.md).

| Command                        | Target                     | Options                                                                                            |
| ------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------- |
| `./hb backup create`           | Emulator or `--production` | `--no-auth`                                                                                        |
| `./hb backup list`             | Emulator or `--production` | —                                                                                                  |
| `./hb backup restore <backup>` | Emulator or `--production` | `--no-auth`, `--overwrite-users`, `--dry-run`, `-y, --yes`                                         |
| `./hb backup schedule`         | Production                 | `--daily`, `--weekly [day]`, `--retention <days>`, `--pitr`, `--disable`, `--dry-run`, `-y, --yes` |

## `hb editor`

See [Content](../guides/content.md#content-editors).

| Command                      | Target     | Options                  |
| ---------------------------- | ---------- | ------------------------ |
| `./hb editor list`           | Production | —                        |
| `./hb editor add <email>`    | Production | `--dry-run`, `-y, --yes` |
| `./hb editor remove <email>` | Production | `--dry-run`, `-y, --yes` |

## `hb edition`

See [Next edition](../guides/next-edition.md).

| Command                        | Target                     | Options                                         |
| ------------------------------ | -------------------------- | ----------------------------------------------- |
| `./hb edition list`            | Local                      | —                                               |
| `./hb edition new`             | Production                 | `--project <id>`, `--dry-run`, `-y, --yes`      |
| `./hb edition switch`          | Production                 | `--archive-url <url>`, `--dry-run`, `-y, --yes` |
| `./hb edition feedback [year]` | Emulator or `--production` | `--folder <path>`                               |
| `./hb edition rebuild <year>`  | Production                 | `--dry-run`, `-y, --yes`                        |

## `hb upgrade`

See [Upgrade](../guides/upgrade.md).

```console
./hb upgrade [version] [--migrations-only] [--no-data] [--production] [--continue | --abort] [--dry-run] [-y, --yes]
```

## `hb notify`

See [Notifications](../guides/notifications.md).

```console
./hb notify --title <text> --body <text> [--path <path>] [--icon <url>] [--production] [--dry-run] [-y, --yes]
```

## npm scripts and `FIRESTORE_TARGET`

Run from the repository root:

| Command         | Description                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm start`     | Start the Firebase emulators, Cloud Functions and the Astro dev server at http://localhost:4321.               |
| `npm run build` | Build every page to `packages/web/dist`. Reads content from `FIRESTORE_TARGET` (the emulator when unset).      |
| `npm run serve` | Build from the emulator data, then serve `packages/web/dist` on the Hosting emulator at http://localhost:5000. |
| `npm test`      | Run all Vitest test projects.                                                                                  |
| `npm run lint`  | Run ESLint, Prettier, syncpack, lit-analyzer, `./hb config validate`, `astro check` and TypeScript checks.     |
| `npm run fix`   | Run ESLint and Prettier autofix.                                                                               |

`FIRESTORE_TARGET` controls where `npm run build` reads content (`unset` for the emulator, `production`, `none`, or `sample`); see [How it works](../how-it-works.md#emulator-or-production).

## See also

- [How it works](../how-it-works.md)
- [Manage data](../guides/manage-data.md)
- [Backups](../guides/backups.md)
- [Upgrade](../guides/upgrade.md)
