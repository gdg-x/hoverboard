# Configure

Your site's config and content live in `packages/config`:

- `site.json`: settings such as the Firebase project, site URL, base path, Google Maps key, organizer, location, social links and colors.
- `content/resources.json`: event text, such as the title, description and the about blocks.
- `content/faq.md`, `content/coc.md` and `content/posts/`: the FAQ, code of conduct and blog posts.

Upstream defaults for the other settings in `site.json`, such as `navigation` and `features`, are in `packages/web/defaults/site.json`. Your `site.json` only needs the values you change. Objects merge with the defaults, and lists and other values replace them. For example, a `navigation` list in `site.json` replaces the whole default list. The UI text, such as button labels and page titles, is part of the app and its translations, not of the config.

`packages/config/site.json`:

```json
  "$schema": "../web/schemas/site.schema.json",
  "firebase": { "projectId": "my-devfest" },
  "shortName": "DevFest",
  "organizer": { "name": "..", "email": "..", ... },
  "event": { "startDate": "2027-10-15", "endDate": "2027-10-16", "timezone": "Europe/Kyiv", "location": {..} },
  "schedule": { "published": true },
  "social": { "hashtag": "..", "follow": [..] },
  "auth": { "providers": ["google"] },
  "theme": { "name": "festival", "colorScheme": "system", "colors": {..}, "fonts": {..} },
  "integrations": { "googleMapsApiKey": ".." },
  "heroSettings": {..},
  ...
```

`firebase.projectId` is the Firebase project that `./hbd deploy`, the deploy workflows and `FIRESTORE_TARGET=production` commands use. `url` defaults to `https://<projectId>.web.app/`. Set `url` only for a custom domain.

`event.timezone` is the [IANA time zone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) of the event, for example `Europe/Kyiv` or `America/New_York`. Session days and times in Firestore are in this time zone. Calendar links, the feedback window and session reminders use it. The schedule shows times in it, and visitors in another time zone can switch the schedule to their own. During the event, a line on the schedule marks the current time.

`theme` picks the look: the `festival`, `spotlight` or `paper` theme, the color scheme, colors, fonts, spacing and decorations. See [Styling][style app].

## Validation

[JSON Schemas](https://json-schema.org/) in `packages/web/schemas/` describe both files: `site.schema.json` and `resources.schema.json`. Because the files set `$schema`, editors such as VS Code show completion and errors while you type. Unknown keys are errors, so typos fail early.

The config is checked with the defaults merged in. The build, `npm run lint` and `./hbd doctor` all fail with every error and its path. Run the check on its own with:

```console
  ./hbd validate-config
```

The check also catches navigation to an unknown page, and images that are not in `packages/web/public`.

## Editing on GitHub

You can change the config and content without installing anything, in the GitHub web editor. Every change gets a preview site before it goes live. This needs the deploy workflows set up first ([Deploying to Firebase with Github Actions](04-deploy.md#deploying-to-firebase-with-github-actions)).

1. Open the file in `packages/config` on GitHub, for example `content/resources.json`, and select the pencil icon. To edit several files at once, press `.` on the repository page to open github.dev.
1. Make your change. Keep the JSON valid: quotes around keys and text, commas between items, and no comma after the last item.
1. Select **Commit changes**, choose **Create a new branch for this commit and start a pull request**, then **Propose changes** and **Create pull request**.
1. The `Deploy Preview` workflow checks the config with `./hbd validate-config` first. If the config has errors, the `validate_config` check fails and nothing deploys. Each error shows on its file in the **Files changed** tab (verify). Fix them by editing the file on the pull request's branch.
1. When the check passes, a comment on the pull request links to the preview site. It expires after a day, and every new commit updates it.
1. Merge the pull request. The `Deploy` workflow publishes the change to the live site.

The preview reads content from your production Firestore, so it shows the same sessions and speakers as the live site. Changes to Cloud Functions, rules and features that the functions read only take effect after the merge.

Pull requests from forks are checked, but do not get a preview. Edit as a collaborator of the repository instead.

`faq.md` and `coc.md` can use these values in [Nunjucks](https://mozilla.github.io/nunjucks/) templates, with one namespace per file. For example `{{ site.url }}` comes from `site.json`, and `{{ resources.title }}` from `content/resources.json`.

Both pages list their `##` and `###` headings in a table of contents. Each `##` heading needs to come before the `###` headings under it. In the FAQ, `##` headings group the questions, and each `###` heading is a question that visitors open to read the answer below it.

## Pages configuration

Disable, reorder or modify blocks for individual pages inside their individual files that can be found in the `packages/web/src/views/` folder.

The top block (aka 'hero') of the home page shows the event name, dates, place and `heroDescriptions.home`, on a dotted band in the theme's colors. `heroSettings` in `packages/config/site.json` is optional:

- `illustration`: an SVG in `packages/web/public` shown next to the text, for example a line drawing of your city. A drawing in `currentColor` follows the theme and the color scheme. Without one, the hero shows a drawing of a talk. It is hidden on narrow screens and when `theme.decorations` is `false`.
- `background.image`: a photo behind the text. The hero darkens it with the dark scheme's `scrim` color and uses the dark scheme's text color, and the build checks their contrast.

```json
"heroSettings": {
  "home": {
    "illustration": "/images/lviv.svg"
  }
}
```

The hero follows the event dates in the event time zone. Before the event, it counts the days and offers tickets. During the event, it says "Live now" and links to the schedule. After the event, it thanks attendees and links to the videos and photos.

The text under a page's title is in `heroDescriptions` in `packages/config/content/resources.json`, so it can be translated. `home` is required, and `blog`, `coc`, `faq`, `notFound`, `previousSpeakers`, `schedule`, `speakers` and `team` are optional. The titles themselves are part of the UI text.

```json
"heroDescriptions": {
  "home": "Join the commuity, learn new things!",
  "speakers": "Hear from the Googlers, Partners, and Guest Speakers who are building the future of the cloud."
}
```

The event dates on the home page come from `event.startDate` and `event.endDate`, formatted for the visitor's language.

The numbers next to the about text are `aboutBlock.statisticsBlock` in `packages/config/content/resources.json`. Each can have an `emoji`, for fun.

The venue block shows `event.location` with directions in Google Maps, Apple Maps and OpenStreetMap. With `integrations.googleMapsApiKey`, it also has a map that loads only when a visitor asks for it, so other visits do not load Google Maps.

The team page opens with the organizers' photo, `aboutOrganizerBlock.image`, which the home page shows too, and `team.description`, both in `packages/config/content/resources.json`.

A speaker's page lists their sessions and, when `previousSpeakers` is on and a previous speaker has the same ID, their talks in earlier years. The previous speakers page groups speakers by the years they spoke.

If you don't need some pages, turn their features off. See [Features](#features).

## Features

Turn parts of the site off in `features` in `packages/config/site.json`. Every feature is on by default, except `demo` and `forkMe`.

```json
"features": {
  "previousSpeakers": false,
  "tickets": false
}
```

A feature that is off has no pages, navigation entry or home page block, and its code is left out of the build. The features are `blog`, `codeOfConduct`, `demo`, `faq`, `feedback`, `forkMe`, `gallery`, `imageOptimization`, `mailchimp`, `map`, `mySchedule`, `notifications`, `partners`, `previousSpeakers`, `schedule`, `speakers`, `subscribe`, `team`, `tickets` and `videos`.

The build fails when:

- a feature needs one that is off: `schedule` needs `speakers`, `mySchedule` and `feedback` need `schedule`, and `mailchimp` needs `subscribe`.
- event text links to the page of a feature that is off, for example `/faq` in `footerRelBlock`.

`demo` adds a band across the top of every page where visitors can try the built-in themes, the spacing and light or dark. Their browser remembers the choices. It is meant for demo sites, so leave it off on an event's site.

Every Cloud Function always deploys. When its feature is off, it logs an error that names the `site.json` key and does nothing. `mailchimpSubscribe` needs `mailchimp`, `sendGeneralNotification` needs `notifications`, `scheduleNotifications` needs `notifications` and `mySchedule`, `optimizeImages` needs `imageOptimization`, and the schedule generator needs `schedule` or `speakers`. The functions read the flags and `event.timezone` from `site-config.json`, which their build copies from `site.json`, so deploy the functions again after changing these values.

When `feedback` is off, the feedback dialog is still in the build, but nothing opens it. Bookmark buttons show only when `mySchedule` is on.

The header follows the features too. Its button links to tickets until the event is over, or to the schedule otherwise. The account button shows when `mySchedule` or `feedback` is on, and the notifications bell when `notifications` is on. The footer links to the home page's subscribe band when `subscribe` is on, and shows a "Fork me on GitHub" sticker when `forkMe` is on.

## Navigation

Define the header pages and their urls in `navigation` in `packages/config/site.json`. On narrow screens, they move to a full-screen menu. The default list is in `packages/web/defaults/site.json`. A `route` is `home` or a feature that has a page: `blog`, `codeOfConduct`, `faq`, `mySchedule`, `previousSpeakers`, `schedule`, `speakers` or `team`. The labels are part of the UI text, so they follow the visitor's language.

```json
"navigation": [
  { "route": "home", "permalink": "/" },
  { "route": "speakers", "permalink": "/speakers" },
  ...
]
```

## Text and languages

The text on the site comes from your config, from Firestore and from the app:

| Text                                                                                         | Where it is                                | Who edits it                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------- |
| Event text, such as the title, description, hero descriptions, about blocks and footer links | `packages/config/content/resources.json`   | You                          |
| The FAQ, the Code of Conduct and blog posts                                                  | `packages/config/content/`                 | You                          |
| Sessions, speakers, the schedule, the team, partners and the blog list                       | Firestore                                  | You, in the database         |
| UI text, such as buttons, labels, page titles, navigation and messages                       | `msg()` calls in `packages/web/src`        | Upstream                     |
| UI translations                                                                              | `packages/translations/xliff/<locale>.xlf` | Upstream, not edited by hand |

UI text is the same on every site, so it is not in `packages/config`. To change its wording, open a pull request upstream, so every site gets the change and translators see it. A fork can change a `msg()` call too. Then run `npm --prefix packages/web run localize:extract`, and expect conflicts when you upgrade. Existing translations of that text keep the old meaning.

### Site languages

`locales` in `packages/config/site.json` sets the languages of the site. `source` is the default locale and the language of your content. The pages and `manifest.json` are built in this language, and their `lang` is set to it. In a visitor's browser, the page switches to their language once it has loaded. `targets` lists the other locales that visitors can pick in the footer. Every locale other than `en` needs UI translations in `packages/translations/xliff/`, and the build fails without them. None ship yet, so sites are in English only:

```json
"locales": { "source": "en", "targets": [] }
```

The app picks a visitor's language in this order: the one they picked before, the first of their browser's languages that the site offers, then `source`. A browser language with a region, such as `es-MX`, matches `es`. The picker in the footer shows only when the site offers more than one language, and the browser remembers the choice. A language downloads the first time a visitor picks it, and works offline after that.

Dates and numbers follow the visitor's language. Session days and times stay in `event.timezone`, unless a visitor switches the schedule to their own time zone.

These are not translated: data in Firestore, blog posts, push notifications, `manifest.json`, and the page titles and descriptions that search engines and link previews read.

### Translating event content

Translate your event content for a target locale in `packages/config/content/locales/<locale>/resources.json`. It takes the same keys as `content/resources.json`, and only the ones you translate. Objects merge with `content/resources.json`, and lists replace it. A key you leave out shows the text in `source`. The build fails on a key that is not in `content/resources.json`, and on a folder whose locale is not in `targets`.

```json
{
  "title": "DevFest Ucrania",
  "aboutBlock": { "statisticsBlock": { "days": { "label": "Días" } } }
}
```

Translate the FAQ and Code of Conduct pages with `faq.md` and `coc.md` in the same folder. A page without a translation shows `content/faq.md` or `content/coc.md`. The build fails on any other file in the folder.

## "Become a partner" - how it works?

`Become a partner` button opens a form with `company name`, `name` and `email` fields. After a user (potential partner) filled a form, this data is saved into Firestore DB, `potentialPartners` node. It gives the possibility to contact back those people who are interested to be a partner with you and collaborate earlier.

## Next steps

Now your Hoverboard is configured, learn how to integrate [firebase][firebase] with, [style][style app] and [deploy][deploy] your app.

[style app]: 03-styling.md
[deploy]: 04-deploy.md
[firebase]: 02-firebase.md
