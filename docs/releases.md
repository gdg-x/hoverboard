# Releases

How Hoverboard is versioned and released, and what counts as a breaking change.

## Versioning

Hoverboard uses [semantic versioning](https://semver.org/). The whole repo has one version, kept in the root [package.json](../package.json) and tagged as `vX.Y.Z`. The packages in `packages/` are private and not published, so their own `version` fields are not release versions.

A version describes the impact of an update on a site that runs Hoverboard.

### Major: breaking changes

Anything that makes an organizer change something to keep their site working after updating:

- **Config.** Removing or renaming a key, changing its meaning or type, or adding a required key with no default. This covers `site.json`, the content files and `schemaVersion`.
- **Content files.** Changing the location or format of `resources.json`, markdown pages, blog posts or images.
- **Firestore data.** Renaming or removing a collection or field, changing a field's type, or adding a required field.
- **Security rules.** Firestore or Storage rules that reject data or requests that were allowed before.
- **Functions.** Removing or renaming a function, changing its trigger, or requiring a new secret, API or Firebase service.
- **CLI.** Removing or renaming an `hb` command or flag, or changing a default in a way that changes the result.
- **Requirements.** Raising the minimum Node.js version in `engines`, requiring a different Firebase plan, or dropping a supported browser.
- **URLs.** Removing or changing a route without a redirect, which breaks shared links and search results.

### Minor: features

New features, new optional config keys with defaults, new built-in themes, new locales, new `hb` commands and flags, and deprecations.

### Patch: fixes

Bug fixes, security fixes, translation fixes, and dependency updates with no change in behavior.

## Breaking changes

Every breaking change must:

- Use `!` in the pull request title, for example `feat(config)!: rename event.dates`.
- Explain what organizers need to do in a `BREAKING CHANGE:` paragraph at the end of the pull request description. It becomes part of the release notes.
- From v4 on, ship an `hb upgrade` migration for config and Firestore data changes, with tests against the previous shape. See [Migrations](#migrations).

When possible, deprecate first: keep the old behavior working in a minor release with a warning from the build or `hb doctor`, then remove it in the next major.

## Upgrading

`./hb upgrade [version]` upgrades a site to a release, the latest by default:

1. It needs a clean working tree. It adds the `upstream` remote, `https://github.com/gdg-x/hoverboard.git`, when no remote points there, and fetches the releases.
2. It shows the release notes since your version, with the breaking changes first, and your changes to Hoverboard's files outside `packages/config`, marking the ones the release changes too. Those are the likely conflicts. Then it asks.
3. It merges the release's tag into a new branch, `upgrade/v<version>`, and resolves what it knows how to:
   - Lockfiles are never merged as text. It takes the release's, then adds your own dependencies back with `npm install --package-lock-only`.
   - `package.json` files merge by key. `version` and every dependency take the release's value, which upstream tested, and dependencies only you added stay. A dependency you changed and the release didn't goes back to the release's version, and the upgrade lists it.
   - A file you deleted stays deleted, such as `.github/dependabot.yml`.
   - `README.md` and files in `packages/web/public/images` keep your version.
4. On other conflicts, it stops and lists them. Resolve them, `git add` them, and run `./hb upgrade --continue`. `./hb upgrade --abort` goes back to where you started.
5. It runs `npm ci`, the release's config migrations, and a build without content, then commits.
6. It offers to push the branch and open a pull request with the [GitHub CLI](https://cli.github.com/).

The production data migrations run from the upgrade branch, before you merge: `./hb upgrade --production --migrations-only --dry-run`, then without `--dry-run`. Merge the pull request with a merge commit, not a squash, so the next upgrade starts from this release. A squash makes the next upgrade start from the old release and repeat every conflict.

A repository made from the template, or a downloaded copy, shares no history with Hoverboard. The first upgrade records the release in the root `package.json` as merged, without changing a file, so later merges start from it. This is only right when your files match that release apart from your own changes, which the upgrade lists first (verify).

The [Upgrade Hoverboard](../.github/workflows/upgrade.yaml) workflow runs `./hb upgrade --yes` every Monday, and opens the pull request. When the upgrade stops on a conflict, the workflow fails: run `./hb upgrade` on your computer. A pull request the workflow opens doesn't start the other workflows, such as the preview deploy, until you push to it, or close and reopen it (verify).

## Migrations

`./hb upgrade --migrations-only` brings a site's config and data up to the Hoverboard version it runs. The code upgrade runs it with `--no-data`:

1. It moves `site.json` to the current `schemaVersion`, one config migration at a time, and checks the result like `./hb config validate`.
2. It runs the Firestore data migrations and fixes, as `./hb data check --fix` does, with the same backup and confirmation. It reads the emulator unless you add `--production`. `--no-data` skips them.

`--dry-run` shows both without writing anything. A `site.json` without `schemaVersion` is from before v4, and `hb upgrade` refuses it.

To change the shape of `site.json`, add a migration to `CONFIG_MIGRATIONS` in [packages/cli/src/migrations/config.ts](../packages/cli/src/migrations/config.ts), with the next version, and set that `schemaVersion` in `packages/demo-config/site.json`. A test fails when they disagree. To change Firestore data, add a migration to [packages/cli/src/migrations/](../packages/cli/src/migrations/) and list it in `MIGRATIONS`, as in [firebase-utils.md](tutorials/firebase-utils.md#migrations).

## Pull requests

Pull requests are squash merged, and the title becomes the commit message. Titles follow [Conventional Commits](https://www.conventionalcommits.org/), which the [PR Title](../.github/workflows/pr-title.yaml) check enforces.

| Type       | Use for                                       | In release notes | Version bump |
| ---------- | --------------------------------------------- | ---------------- | ------------ |
| `feat`     | A new feature for organizers or attendees     | Features         | Minor        |
| `fix`      | A bug fix                                     | Bug Fixes        | Patch        |
| `perf`     | A performance improvement                     | Performance      | Patch        |
| `revert`   | Reverting an earlier change                   | Reverts          | Patch        |
| `docs`     | Documentation and tutorials                   | Documentation    | None         |
| `refactor` | Code changes with no change in behavior       | Hidden           | None         |
| `test`     | Tests only                                    | Hidden           | None         |
| `build`    | Build tooling                                 | Hidden           | None         |
| `ci`       | Workflows                                     | Hidden           | None         |
| `chore`    | Everything else, including dependency updates | Hidden           | None         |
| `style`    | Formatting only                               | Hidden           | None         |

Any type with `!` is a major bump. Scopes are optional. Use the package or area, for example `web`, `functions`, `cli`, `storage`, `config` or `deps`.

Write titles for organizers reading the release notes: `fix(web): show session times in the event time zone`, not `fix: tz bug`.

## Making a release

[release-please](https://github.com/googleapis/release-please) runs on every push to `main` ([workflow](../.github/workflows/release-please.yaml), [config](../release-please-config.json)). It keeps one release pull request open that bumps the version and adds the new notes to [CHANGELOG.md](../CHANGELOG.md). Merging that pull request tags the release and publishes a GitHub release.

- Merge the release pull request when the release is ready. There is no fixed schedule. Fixes should be released soon after they land.
- Until v4 ships, `release-as` in the config pins the release pull request to `4.0.0`, so it collects the v4 notes as work lands. Remove `release-as` in the pull request that releases v4.
- Pull requests created with the default `GITHUB_TOKEN` do not trigger other workflows. To run CI on the release pull request, add a `RELEASE_PLEASE_TOKEN` secret with a fine-grained token that can write contents and pull requests.

Repository settings this process depends on:

- Allow squash merging only, with the default commit message set to the pull request title and description.
- Allow GitHub Actions to create and approve pull requests (Settings, Actions, General).

## Supported versions

Only the latest major version gets fixes. v3 ended at v3.1.0, and there will be no more 3.x releases. Pre-v4 sites relaunch on v4 and move their content over by hand.
