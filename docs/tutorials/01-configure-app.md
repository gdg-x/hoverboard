# Configure

Your site's config and content live in `packages/config`:

- `site.json`: settings such as the Firebase project, site URL, base path, Google Maps key, organizer, location, social links and colors.
- `content/resources.json`: event text, such as the title, description and the about blocks.
- `content/faq.md`, `content/coc.md` and `content/posts/`: the FAQ, code of conduct and blog posts.

Upstream defaults for everything else, such as the UI text and page titles, are in `packages/web/defaults/`. Your files only need the values you change. Objects merge with the defaults, and lists and other values replace them. For example, a `navigation` list in `site.json` replaces the whole default list.

`packages/config/site.json`:

```json
  "$schema": "../web/schemas/site.schema.json",
  "firebase": { "projectId": "my-devfest" },
  "shortName": "DevFest",
  "organizer": { "name": "..", "email": "..", ... },
  "event": { "startDate": "2027-10-15", "endDate": "2027-10-16", "location": {..} },
  "schedule": { "published": true },
  "social": { "hashtag": "..", "follow": [..] },
  "auth": { "providers": ["google"] },
  "theme": { "name": "default", "colors": {..}, "tagColors": {..} },
  "integrations": { "googleMapsApiKey": ".." },
  "heroSettings": {..},
  ...
```

`firebase.projectId` is the Firebase project that `./hbd deploy`, the deploy workflows and `FIRESTORE_TARGET=production` commands use. `url` defaults to `https://<projectId>.web.app/`. Set `url` only for a custom domain.

## Validation

[JSON Schemas](https://json-schema.org/) in `packages/web/schemas/` describe both files: `site.schema.json` and `resources.schema.json`. Because the files set `$schema`, editors such as VS Code show completion and errors while you type. Unknown keys are errors, so typos fail early.

The config is checked with the defaults merged in. The build, `npm run lint` and `./hbd doctor` all fail with every error and its path. Run the check on its own with:

```console
  ./hbd validate-config
```

The check also catches navigation to an unknown page, and images that are not in `packages/web/public`.

`index.html`, `manifest.json`, `faq.md` and `coc.md` can use these values in [Nunjucks](https://mozilla.github.io/nunjucks/) templates, with one namespace per file. For example `{{ site.url }}` comes from `site.json`, and `{{ resources.title }}` from `content/resources.json`.

## Pages configuration

Disable, reorder or modify blocks for individual pages inside their individual files that can be found in the `packages/web/src/pages/` folder.
The top block (aka 'hero') view of the page can be adjusted via `heroSettings` in `packages/config/site.json`. Its colors come from the theme ([Styling](03-styling.md)).

```json
"heroSettings": {
  "home": {
    "description": "Join the commuity, learn new things!",
    "background": {
      "image": "/images/backgrounds/home.jpg"
    }
  },
  "blog": {
    "title": "Blog",
    "metaDescription": "Read stories from our team"
  },
  "speakers": {
    "title": "Speakers",
    "metaDescription": "Hear from the Googlers, Partners, and Guest Speakers who are building the future of the cloud. Check back often as we add more speakers, including our customers and partners.",
    "description": "Hear from the Googlers, Partners, and Guest Speakers who are building the future of the cloud. Check back often as we add more speakers, including our customers and partners."
  }
  ...
 }
```

If you don't need some pages, turn their features off. See [Features](#features).

## Features

Turn parts of the site off in `features` in `packages/config/site.json`. Every feature is on by default, except `forkMe`.

```json
"features": {
  "previousSpeakers": false,
  "tickets": false
}
```

A feature that is off has no pages, navigation entry or home page block, and its code is left out of the build. The features are `blog`, `codeOfConduct`, `faq`, `feedback`, `forkMe`, `gallery`, `imageOptimization`, `mailchimp`, `map`, `mySchedule`, `notifications`, `partners`, `previousSpeakers`, `schedule`, `speakers`, `subscribe`, `team`, `tickets` and `videos`.

The build fails when:

- a feature needs one that is off: `schedule` needs `speakers`, `mySchedule` and `feedback` need `schedule`, and `mailchimp` needs `subscribe`.
- `map` is on without `integrations.googleMapsApiKey`.
- event text links to the page of a feature that is off, for example `/faq` in `footerRelBlock`.

Every Cloud Function always deploys. When its feature is off, it logs an error that names the `site.json` key and does nothing. `mailchimpSubscribe` needs `mailchimp`, `sendGeneralNotification` needs `notifications`, `scheduleNotifications` needs `notifications` and `mySchedule`, `optimizeImages` needs `imageOptimization`, and the schedule generator needs `schedule` or `speakers`. The functions read the flags from `features.json`, which their build copies from `site.json`, so deploy the functions again after changing these features.

Some parts of a feature still show when it is off: the feedback block and dialog, the My Schedule bookmark button, the notifications toggle, and the ticket link in the header.

## Toolbar Navigation

Define a page's label and url in `navigation` in `packages/config/site.json`. The default list is in `packages/web/defaults/site.json`.

```json
"navigation": [
  {
    "route": "home",
    "permalink": "/",
    "label": "Home"
  },
  {
    "route": "speakers",
    "permalink": "/speakers",
    "label": "Speakers"
  },
  ...
]
```

## "Become a partner" - how it works?

`Become a partner` button opens a form with `company name`, `name` and `email` fields. After a user (potential partner) filled a form, this data is saved into Firestore DB, `potentialPartners` node. It gives the possibility to contact back those people who are interested to be a partner with you and collaborate earlier.

## Next steps

Now your Hoverboard is configured, learn how to integrate [firebase][firebase] with, [style][style app] and [deploy][deploy] your app.

[style app]: 03-styling.md
[deploy]: 04-deploy.md
[firebase]: 02-firebase.md
