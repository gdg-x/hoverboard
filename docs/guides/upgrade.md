# Upgrade

Upgrade your site to a new Hoverboard release with `./hb upgrade`, review automatic weekly upgrade pull requests, and run config and Firestore data migrations.

**For:** [fork maintainers](../README.md#fork-maintainer) and [returning organizers](../README.md#returning-organizer).

## Upgrade to a release

`./hb upgrade [version]` upgrades a site to a Hoverboard release, the latest by default:

```console
./hb upgrade
```

1. It needs a clean working tree. It adds the `upstream` remote (`https://github.com/gdg-x/hoverboard.git`) when no remote points there, and fetches the releases. From a week before the event to its last day, it warns that an upgrade could break the site when attendees need it, and asks before going on. `--migrations-only` warns too.
1. It shows the release notes since your version, with breaking changes first, and lists your changes to Hoverboard's files outside `packages/config`, marking the ones the release changes too. Those are the likely conflicts. Then it asks.
1. It merges the release's tag into a new branch, `upgrade/v<version>`, and resolves what it knows how to (see [Customize](customize.md#what-hb-upgrade-resolves)).
1. On other conflicts, it stops and lists them. Resolve them, `git add` them, and run `./hb upgrade --continue`. `./hb upgrade --abort` goes back to where you started and deletes the upgrade branch.
1. It runs `npm ci`, the release's config migrations, and a build without content, then commits.
1. It offers to push the branch and open a pull request with the [GitHub CLI](https://cli.github.com/).

Run the production data migrations from the upgrade branch before you merge:

```console
./hb upgrade --production --migrations-only --dry-run
./hb upgrade --production --migrations-only
```

Deploys do not run data migrations. Merge the pull request with a **merge commit**, not a squash, so the next upgrade starts from this release. A squash makes the next upgrade start from the old release and repeat every conflict.

A repository made from the GitHub template, or a downloaded copy, shares no git history with Hoverboard. The first upgrade records the release in the root `package.json` as merged, without changing a file, so later merges start from it. This is only right when your files match that release apart from your own changes, which the upgrade lists first (verify).

## Weekly upgrade workflow

The [`.github/workflows/upgrade.yaml`](../../.github/workflows/upgrade.yaml) workflow runs `./hb upgrade --yes` every Monday and opens a pull request when there is a new release. When an upgrade stops on a conflict, the workflow fails: run `./hb upgrade` on your computer. A pull request opened by the workflow doesn't start other workflows, such as the preview deploy, until you push to it or close and reopen it (verify).

## Migrations

`./hb upgrade --migrations-only` brings a site's config and Firestore data up to the Hoverboard version it runs (the code upgrade runs it with `--no-data`):

1. Moves `packages/config/site.json` to the current `schemaVersion`, one config migration at a time, and validates the result like `./hb config validate`.
1. Runs the Firestore data migrations and safe fixes, as `./hb data check --fix` does, with the same backup in `.firebase/backups/<date>/` and confirmation. It reads the emulator unless you add `--production`. `--no-data` skips the data migrations.

`--dry-run` shows both without writing anything. `config/migrations` in Firestore records the data migrations that ran, with when and how many documents they changed:

- `4.0.0-schedule-on-sessions`: runs when the `schedule` collection has days and no session has a `day`. Before v4, a session's time and track came from where its ID was in `schedule`, and functions copied the result into `generatedSchedule`, `generatedSessions` and `generatedSpeakers`. Hoverboard no longer reads these collections. The migration writes each session's `day`, `startTime`, `endTime` and `track` onto the session, and the tracks to `schedule.tracks` in `packages/config/site.json`:
  - A timeslot with several sessions in one track shares its time evenly between them, in whole minutes. Check those times afterwards.
  - A session on the schedule more than once gets a copy for each extra time, such as `lunch-2`.
  - A track that is only on some days gets those days in `days`.
  - It leaves the `schedule` collection in place. Commit the change to `site.json`, check the schedule and deploy, then delete the old collections and `config/schedule` (`schedule.published` in `site.json` replaces it). `./hb data check` lists the commands to delete them.
- `4.0.0-sign-up-ids`: runs when a `subscribers` or `potentialPartners` document has the email as its ID. Copies each one to a random ID and deletes the old document in the same write. The plan shows only how many move, not the emails.

When deploying after upgrading from v3, Firebase may find functions that are no longer in the code (`sessionsWrite`, `scheduleWrite`, `speakersWrite`) and ask before deleting them. Answer yes (`deploy.yaml` passes `--force` and deletes them automatically).

## Supported versions

Only the latest major version gets fixes. v3 ended at v3.1.0, and there will be no more 3.x releases. A `site.json` without `schemaVersion` is from before v4, and `./hb upgrade` refuses it; pre-v4 sites relaunch on v4 and move their content over.

## See also

- [Customize](customize.md)
- [Manage data](manage-data.md)
- [Releases](../contributing/releases.md)
