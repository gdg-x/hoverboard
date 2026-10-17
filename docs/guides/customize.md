# Customize

Keep your event's changes in `packages/config` so upgrades stay conflict-free, and understand how `./hb upgrade` handles changes outside it.

**For:** [fork maintainers](../README.md#fork-maintainer).

## What is yours vs Hoverboard's

- `packages/config/` belongs to your site: `site.json`, `content/`, `public/`, `custom.css` and `editions.json`. Hoverboard never changes files in `packages/config/`, so upgrades never conflict there.
- Everything outside `packages/config/` is Hoverboard's code, tests and workflows.

## Use the extension points first

Before editing code in `packages/web/src/`, check whether `packages/config` already supports what you need:

- **Theme, colors, fonts and decorations:** pick one of the five built-in themes and override colors, fonts, density or decorations in `theme` in `packages/config/site.json`. See [Look and feel](look-and-feel.md).
- **Custom styles:** set `--hb-` CSS variables or page-level styles in `packages/config/custom.css`, which every page loads after the theme. See [Look and feel](look-and-feel.md#custom-css).
- **Images and icons:** put your own files in `packages/config/public/`, which the build lays over `packages/web/public/`.
- **Features and navigation:** turn unused features off in `features` and customize header links in `navigation` in `packages/config/site.json`. See [Pages](pages.md) and [Features reference](../reference/features.md).

## Keep code changes small

If you do change Hoverboard's code—for example, reordering or removing blocks on a page in `packages/web/src/views/`—keep the change to as few files and lines as possible.

Run `./hb status` at any time to see the files outside `packages/config/` that your fork has changed since the current Hoverboard release. Before merging a new release, `./hb upgrade` lists those files and marks the ones the release also changed, which are the likely merge conflicts.

## What `hb upgrade` resolves

When `./hb upgrade` merges a release tag into your fork, it automatically resolves several files outside `packages/config/`:

- `package-lock.json` files are never merged as text. The upgrade takes the release's lockfile, then adds your own extra dependencies back with `npm install --package-lock-only`.
- `package.json` files merge by key. `version` and every dependency in the release take the release's tested version, and dependencies only you added stay. A dependency you changed that the release didn't goes back to the release's version, and the upgrade lists it.
- A file you deleted stays deleted, such as `.github/dependabot.yml`.
- `README.md` and files in `packages/web/public/images` keep your version.

## Dependabot in forks

Hoverboard tests and ships dependency updates in its releases, and `./hb upgrade` brings those updates into your fork and resolves the `package.json` and lockfiles. Turning on Dependabot version updates in a fork creates extra commits on `package.json` and `package-lock.json` that `./hb upgrade` will revert to the release's versions anyway. Keep Dependabot **security alerts** on (see [Security](security.md#what-you-set)), and leave Dependabot version update pull requests off in forks.

## See also

- [Look and feel](look-and-feel.md)
- [Upgrade](upgrade.md)
- [How it works](../how-it-works.md)
