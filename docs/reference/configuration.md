# Configuration reference

Files in `packages/config`, how defaults merge, schema validation, and every top-level key in `site.json` and `content/resources.json`.

## Files in `packages/config`

Your site's config and content live in `packages/config`:

- `site.json`: site settings such as the Firebase project, URL, organizer, event dates and location, schedule tracks, social links, sign-in providers, theme and features.
- `content/resources.json`: event text such as the title, description, hero descriptions, about blocks, footer links and the attending page.
- `content/faq.md`, `content/coc.md` and `content/posts/`: the FAQ, code of conduct and blog posts.
- `content/locales/<locale>/`: translated `resources.json`, `faq.md` and `coc.md`.
- `public/`: your images, such as `images/logo.svg`, `images/icon.png` and `images/social-share.jpg`, served from the site's root over `packages/web/public/`.
- `custom.css`: your own styles, loaded on every page after the theme.
- `editions.json`: archived past editions, managed by `./hb edition`.

Until `packages/config/site.json` exists, the build, `npm start` and `./hb` use the demo site in `packages/demo-config`, and deploys stop so you can't deploy the demo by mistake.

## Defaults and merging

Upstream defaults for `site.json` live in [`packages/web/defaults/site.json`](../../packages/web/defaults/site.json). Your `packages/config/site.json` only needs the values you change:

- **Objects** merge with the defaults (for example, `features` in `site.json` overrides only the flags you list).
- **Arrays and primitive values** replace the default value (for example, `navigation` in `site.json` replaces the entire default list).

## Validation

[JSON Schemas](https://json-schema.org/) in [`packages/web/schemas/`](../../packages/web/schemas/) describe both files: [`site.schema.json`](../../packages/web/schemas/site.schema.json) and [`resources.schema.json`](../../packages/web/schemas/resources.schema.json). Because the files set `$schema`, editors such as VS Code show completion and errors while you type. Unknown keys are errors, so typos fail early.

The config is checked with the defaults merged in. The build, `npm run lint` and `./hb doctor` all fail with every error and its path. Run the check on its own with:

```console
./hb config validate
```

Validation also catches navigation entries that point to an unknown route or disabled feature, links in `resources.json` that point to a disabled feature's page, and images that are missing from `packages/config/public` and `packages/web/public`.

## `site.json` top-level keys

| Key             | Description                                                                                                          | Guide                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `$schema`       | Path to `../web/schemas/site.schema.json` for editor validation.                                                     | [Validation](#validation)                                 |
| `schemaVersion` | Integer version of `site.json`'s shape (`1`). `./hb upgrade` moves it to the current version.                        | [Upgrade](../guides/upgrade.md#migrations)                |
| `firebase`      | `{ "projectId": "..." }` — the Firebase project used by deploys and `./hb` commands with `--production`.             | [Firebase project](../guides/firebase-project.md)         |
| `url`           | Canonical site URL ending with `/`. Defaults to `https://<firebase.projectId>.web.app/`. Set it for a custom domain. | [Deploy](../guides/deploy.md#custom-domain)               |
| `basepath`      | Path the site is served from, starting and ending with `/` (default `"/"`).                                          | —                                                         |
| `shortName`     | Short event name shown under the home screen icon and in the dark header when `logo-dark.svg` is absent.             | [Event details](../guides/event-details.md)               |
| `image`         | Default share image path in `public/` or URL (default `"images/social-share.jpg"`).                                  | [Look and feel](../guides/look-and-feel.md)               |
| `icon`          | App icon path in `public/`, a square PNG (at least 512×512) or SVG (default `"images/icon.png"`).                    | [Look and feel](../guides/look-and-feel.md#app-icon)      |
| `organizer`     | Organizer `name`, `email`, `url`, `blog` and `twitter`.                                                              | [Event details](../guides/event-details.md)               |
| `event`         | `startDate`, `endDate`, `timezone`, `attendance` (`inPerson`, `online`, `hybrid`), `stream` and `location`.          | [Event details](../guides/event-details.md)               |
| `schedule`      | `published` flag and `tracks` list (`id`, `title`, `stream`, `days`).                                                | [Schedule](../guides/schedule.md)                         |
| `social`        | `hashtag` (without `#`) and `follow` links (`name`, `url`).                                                          | [Event details](../guides/event-details.md)               |
| `auth`          | `providers` list (`emailLink`, `google`, `facebook`, `twitter`).                                                     | [Sign-in](../guides/sign-in.md)                           |
| `theme`         | `name`, `colorScheme`, `density`, `decorations`, `colors`, `darkColors`, `fonts`, `tagColors` and `badgeColors`.     | [Look and feel](../guides/look-and-feel.md)               |
| `integrations`  | `googleMapsApiKey` for the interactive venue map.                                                                    | [Event details](../guides/event-details.md#venue-and-map) |
| `security`      | `csp` sources to add to the Content Security Policy, by directive.                                                   | [Security](../guides/security.md#allow-a-widget-or-embed) |
| `locales`       | `source` locale and `targets` list.                                                                                  | [Languages](../guides/languages.md)                       |
| `navigation`    | Header navigation items (`route`, `permalink`).                                                                      | [Pages](../guides/pages.md#navigation)                    |
| `heroSettings`  | Home page hero `illustration` and `background.image`.                                                                | [Pages](../guides/pages.md#home-page-hero)                |
| `callForPapers` | `url`, optional `opens` and `closes` (`YYYY-MM-DD` in `event.timezone`).                                             | [Content](../guides/content.md)                           |
| `archive`       | `{ "year": ..., "current": "..." }` — marks the site as a read-only archived edition; set by `./hb edition switch`.  | [Next edition](../guides/next-edition.md)                 |
| `features`      | Boolean flags turning site features on or off.                                                                       | [Features reference](features.md)                         |

## `content/resources.json` top-level keys

| Key                   | Description                                                                                                    | Guide                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `$schema`             | Path to `../../web/schemas/resources.schema.json` for editor validation.                                       | [Validation](#validation)                                         |
| `title`               | Full event title.                                                                                              | [Content](../guides/content.md)                                   |
| `description`         | Default page description for search engines and link previews.                                                 | [Content](../guides/content.md)                                   |
| `keywords`            | Comma-separated keywords.                                                                                      | [Content](../guides/content.md)                                   |
| `heroDescriptions`    | Text under the title on `home` (required) and each other page.                                                 | [Pages](../guides/pages.md#page-descriptions)                     |
| `aboutBlock`          | Home page about section: `callToAction` (`featuredSessions`, optional `howItWas`) and `statisticsBlock`.       | [Pages](../guides/pages.md)                                       |
| `aboutOrganizerBlock` | Organizer photo (`image`) and `blocks` on the home and team pages.                                             | [Pages](../guides/pages.md)                                       |
| `team`                | Team page intro `description`.                                                                                 | [Pages](../guides/pages.md)                                       |
| `ticketsBlock`        | `ticketsDetails` note shown under the tickets band.                                                            | [Content](../guides/content.md)                                   |
| `featuredVideos`      | Home page videos band `title` and `callToAction`.                                                              | [Pages](../guides/pages.md)                                       |
| `galleryBlock`        | Home page gallery band `title`, `description` and `callToAction`.                                              | [Pages](../guides/pages.md)                                       |
| `subscribeBlock`      | Home page subscribe band `formTitle`.                                                                          | [Manage data](../guides/manage-data.md#export-collections-as-csv) |
| `codeOfConductBlock`  | Code of conduct report `form` link and `contacts`.                                                             | [Content](../guides/content.md)                                   |
| `footerRelBlock`      | Columns of links in the footer (`title`, `links`).                                                             | [Content](../guides/content.md)                                   |
| `mapBlock`            | Venue block `description`.                                                                                     | [Event details](../guides/event-details.md#venue-and-map)         |
| `attendingPage`       | Venue `photo`, `floorPlan`, `online`, `gettingThere`, `doors`, `accessibility`, `accommodation` and `atVenue`. | [Attending page](../guides/attending-page.md)                     |

## See also

- [Features reference](features.md)
- [Content model reference](content-model.md)
- [CLI reference](cli.md)
