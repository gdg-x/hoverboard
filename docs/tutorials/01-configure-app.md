# Configure

Configuration data is split into two files:
`data/settings.json` (configuration data):

```json
  "organizer": {..},
  "url": "..",
  "startDate": "..",
  "endDate": "..",
  "webapp": {..},
  "hashtag": "..",
  "navigation": [..],
  "location": {..}
  "social": [..],
  "gallery": {..},
  ...
```
and `data/resources.json` (texts and other configurations):

### Pages configuration

Disable, reorder or modify blocks for individual page inside their individual files that can be found in `/pages` folder.
The top block (aka 'hero') view of the page can be adjusted via `heroSettings` in `data/settings.json`

```json
"heroSettings": {
  "home": {
    "description": "Be a hero. Be a GDG!",
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
    "metaDescription": "Hear from the Googlers, Partners, and Guest Speakers who are building the future of cloud. Check back often as we add more speakers, including our customers and partners.",
    "description": "Hear from the Googlers, Partners, and Guest Speakers who are building the future of cloud. Check back often as we add more speakers, including our customers and partners.",
    "background": {
      "color": "#FFF"
    },
    "fontColor": "#424242"
  }
  ...
 }
```

If you don't need some pages, don't forget to remove them (or comment out)
in `hoverboard-app.html`

```html
<iron-lazy-pages>
  <home-page
    data-route="home"
    data-path="pages/home-page.html"
  ></home-page>
  <blog-page
    data-route="blog"
    data-path="pages/blog-page.html"
    route="[[subroute]]"
  ></blog-page>
  <speakers-page
    data-route="speakers"
    data-path="pages/speakers-page.html"
    route="[[subroute]]"
  ></speakers-page>
</iron-lazy-pages>
```

### Toolbar Navigation

Define a page's label and url in `navigation` in `data/settings.json`

```json
"navigation": [
  {
    "route": "home",
    "permalink": "/",
    "label": "Home"
  },
  {
    "route": "speakers",
    "permalink": "/speakers/",
    "label": "Speakers"
  },
  ...
]
```

### "Become a partner" - how it works?

<!-- `Become a partner` button opens a form with `company name`, `name` and `email` fields. After a user (potential partner) filled a form, this data is saved into Firestore DB, `potentialPartners` node. It gives a possibility to contact back those people who are interested to be a partner with you and collaborate earlier. -->

This button is wrapped with an anchor tag that includes an email address specified in the `partnersBlock` property of the `resources.json`. To function correctly, this should be of the form `mailto:x@domain.com`, with an optional subject/body of the usual form, encoded properly, e.g. `mailto:x@domain.com?subject=Something%20special`


# Next steps

Now your Hoverboard is configured, learn how to integrate [firebase][firebase] with, [style][style app] and [deploy][deploy] your app.

[style app]: 03-styling.md
[deploy]: 04-deploy.md
[firebase]: 02-firebase.md
