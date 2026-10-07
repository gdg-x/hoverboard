# Configure

Your site's config and content live in `packages/config`:

- `site.json`: settings such as the site URL, base path, Google Maps key, organizer, location, social links and colors.
- `content/resources.json`: event text, such as the title, description and the about blocks.
- `content/faq.md`, `content/coc.md` and `content/posts/`: the FAQ, code of conduct and blog posts.

Upstream defaults for everything else, such as the UI text and page titles, are in `packages/web/defaults/`. Your files only need the values you change. Objects merge with the defaults, and lists and other values replace them. For example, a `navigation` list in `site.json` replaces the whole default list.

`packages/config/site.json`:

```json
  "url": "..",
  "basepath": "/",
  "googleMapApiKey": "..",
  "organizer": {..},
  "startDate": "..",
  "endDate": "..",
  "webapp": {..},
  "hashtag": "..",
  "heroSettings": {..},
  "location": {..},
  "socialNetwork": {..},
  ...
```

`index.html`, `manifest.json`, `faq.md` and `coc.md` can use these values in [Nunjucks](https://mozilla.github.io/nunjucks/) templates, with one namespace per file. For example `{{ site.url }}` comes from `site.json`, and `{{ resources.title }}` from `content/resources.json`.

## Pages configuration

Disable, reorder or modify blocks for individual pages inside their individual files that can be found in the `packages/web/src/pages/` folder.
The top block (aka 'hero') view of the page can be adjusted via `heroSettings` in `packages/config/site.json`

```json
"heroSettings": {
  "home": {
    "description": "Join the commuity, learn new things!",
    "background": {
      "color": "#673ab7",
      "image": "/images/backgrounds/home.jpg"
    },
    "fontColor": "#FFF"
  },
  "blog": {
    "title": "Blog",
    "metaDescription": "Read stories from our team",
    "background": {
      "color": "#FFF"
    },
    "fontColor": "#424242"
  },
  "speakers": {
    "title": "Speakers",
    "metaDescription": "Hear from the Googlers, Partners, and Guest Speakers who are building the future of the cloud. Check back often as we add more speakers, including our customers and partners.",
    "description": "Hear from the Googlers, Partners, and Guest Speakers who are building the future of the cloud. Check back often as we add more speakers, including our customers and partners.",
    "background": {
      "color": "#FFF"
    },
    "fontColor": "#424242"
  }
  ...
 }
```

If you don't need some pages, don't forget to remove them (or comment out)
in `packages/web/src/router.ts`

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
