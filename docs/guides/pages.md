# Pages

Configure the header navigation, the home page hero and sections, and the text and images on each page.

**For:** [first-time organizers](../README.md#first-time-organizer) and [returning organizers](../README.md#returning-organizer).

## Navigation

Define the header pages and their URLs in `navigation` in `packages/config/site.json`. On narrow screens, they move to a full-screen menu. The default list is in `packages/web/defaults/site.json`, and a `navigation` list in `site.json` replaces the whole default list:

```json
"navigation": [
  { "route": "home", "permalink": "/" },
  { "route": "speakers", "permalink": "/speakers" },
  { "route": "schedule", "permalink": "/schedule" },
  { "route": "attending", "permalink": "/attending" },
  { "route": "team", "permalink": "/team" },
  { "route": "blog", "permalink": "/blog" }
]
```

A `route` is `home` or a feature that has a page: `attending`, `blog`, `codeOfConduct`, `faq`, `mySchedule`, `previousSpeakers`, `schedule`, `speakers` or `team`. The labels are part of the UI text, so they follow the visitor's language.

If you don't need a page, turn its feature off in `features` in `site.json`; see [Features reference](../reference/features.md).

## Home page hero

The top block (hero) of the home page shows the event name, dates, place and `heroDescriptions.home`, on a band in the theme's colors. `heroSettings` in `packages/config/site.json` is optional:

- `illustration`: an SVG in `packages/config/public` shown next to the text, for example a line drawing of your city. A drawing in `currentColor` follows the theme and the color scheme. Without one, the hero shows a drawing of a talk. It is hidden on narrow screens and when `theme.decorations` is `false`.
- `background.image`: a photo behind the text. The hero darkens it with the dark scheme's `scrim` color and uses the dark scheme's text color, and the build checks their contrast. If it fails, set a darker `theme.darkColors.scrim`; see [Look and feel](look-and-feel.md#hero).

```json
"heroSettings": {
  "home": {
    "illustration": "/images/lviv.svg"
  }
}
```

The header and the home page hero offer visitors their next step automatically from the features, content and dates—from **Submit a talk** and **Buy ticket** before the event, to **Live now** during it, and videos and photos after it. Before the event, the hero also adds the whole event to a calendar, and adds the highlights video (`aboutBlock.callToAction.howItWas` in `content/resources.json`) when it has room. Leave `howItWas` out until you have a video of your event: `./hb init` leaves out the demo's. See [Run your event](run-your-event.md) for what shows in each stage.

## Page descriptions

The text under each page's title is in `heroDescriptions` in `packages/config/content/resources.json`, so it can be translated. `home` is required, and `attending`, `blog`, `coc`, `faq`, `notFound`, `offline`, `previousSpeakers`, `schedule`, `speakers` and `team` are optional. The page titles themselves are part of the UI text.

```json
"heroDescriptions": {
  "home": "Join the community, learn new things!",
  "speakers": "Hear from the Googlers, Partners, and Guest Speakers who are building the future of the cloud."
}
```

## Home page sections, team and speakers

- **Statistics:** The numbers next to the about text on the home page are `aboutBlock.statisticsBlock` in `packages/config/content/resources.json`. Each can have an `emoji`, for fun.
- **Venue block:** Shows `event.location` with directions and an optional map, and links to the [attending page](attending-page.md) when `attending` is on. See [Event details](event-details.md#venue-and-map).
- **Gallery and videos:** Until the event is over, the gallery and videos bands say they're from past editions, since a new edition starts with last year's photos and videos.
- **Team page:** Opens with the organizers' photo, `aboutOrganizerBlock.image` (which the home page shows too), and `team.description`, both in `packages/config/content/resources.json`.
- **Speaker pages:** List each speaker's sessions and, when `previousSpeakers` is on and a previous speaker has the same ID, their talks in earlier years. The previous speakers page groups speakers by the years they spoke.

To reorder or modify the blocks on a page in `packages/web/src/views/`, see [Customize](customize.md), as code changes outside `packages/config` can conflict during upgrades.

## See also

- [Attending page](attending-page.md)
- [Look and feel](look-and-feel.md)
- [Run your event](run-your-event.md)
- [Features reference](../reference/features.md)
