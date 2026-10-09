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
- From v4 on, ship an `hb upgrade` migration for config and Firestore data changes, with tests against the previous shape.

When possible, deprecate first: keep the old behavior working in a minor release with a warning from the build or `hb doctor`, then remove it in the next major.

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
