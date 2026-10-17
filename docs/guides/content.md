# Content

Edit your event's text, FAQ, code of conduct, blog posts and images in `packages/config`, manage speakers, sessions, partners and tickets in Firestore, and grant team members content editor access.

**For:** [content editors](../README.md#content-editor), [first-time organizers](../README.md#first-time-organizer) and [returning organizers](../README.md#returning-organizer).

## Event text in `resources.json`

`packages/config/content/resources.json` holds your event's text: the title, description, keywords, hero descriptions under each page title, about blocks, organizer block, statistics, ticket details, subscribe prompt, code of conduct contacts and footer links.

`./hb init` replaces the demo's text with starter text for your event the first time you run it. Edit `packages/config/content/resources.json` directly or [on GitHub](edit-on-github.md) to update the text. See [Configuration reference](../reference/configuration.md) for every top-level key.

## Speakers, sessions, partners and tickets in Firestore

Speakers, sessions, partners, team members, tickets, videos, gallery photos, the blog list and previous speakers live in Firestore. You can edit them in the [Firebase console](https://console.firebase.google.com/) or import them with `./hb data` (see [Manage data](manage-data.md)).

- **Empty features stay hidden.** A feature with no documents in Firestore hides its navigation link and home page band until you add content and deploy. See [Features reference](../reference/features.md).
- **Call for papers.** Set `callForPapers` in `packages/config/site.json` to show **Submit a talk** in the header, hero and speakers page while submissions are open:

```json
"callForPapers": {
  "url": "https://sessionize.com/example",
  "opens": "2027-01-10",
  "closes": "2027-03-01"
}
```

`url` is an `https:` link. `opens` and `closes` are the first and last days in `event.timezone`. Without `opens`, it is open from the first deploy, and `closes` must be before `event.startDate`. Each visitor's browser checks the dates, so it opens and closes without a deploy.

- **Tickets.** A ticket document in the `tickets` collection can have `salesOpen` and `salesClose`, the first and last days it is sold (`YYYY-MM-DD` in `event.timezone`). Before `salesOpen`, its button says when it goes on sale, and while no ticket is on sale, the hero says when the first one goes on sale. After `salesClose`, it says sales are closed. `starts` and `ends` are only text on the ticket. When every ticket is `soldOut`, the tickets band says so.
- **Check your edits.** Edits made in the Firebase console are not checked as you make them. Run `./hb data check --production` to validate documents against the schema before deploying.
- **Deploy after content changes.** Visitors' browsers load Firestore edits as soon as a page opens, and a deploy updates the pre-rendered HTML and share images. See [How it works](../how-it-works.md#how-pages-are-built).

## Content editors

People who keep speakers, sessions and posts up to date need to edit Firestore in the Firebase console, without access to billing, functions or deploys. Make them content editors:

```console
./hb editor add ada@example.com
./hb editor list
./hb editor remove ada@example.com
```

It grants their Google account two roles in the Firebase project: **Cloud Datastore User** (`roles/datastore.user`), to read and write the documents, and **Firebase Viewer** (`roles/firebase.viewer`), to open the project in the Firebase console. They can't change billing, functions, Hosting or security rules, or deploy. It can take a few minutes to work (verify that the console's Firestore data page needs no other role). `add` and `remove` take `--dry-run`, and ask first unless you pass `--yes`.

## Markdown pages: FAQ, code of conduct and blog posts

`packages/config/content/faq.md`, `content/coc.md` and `content/posts/` hold the FAQ, the code of conduct and the blog posts.

`faq.md` and `coc.md` can use values from your config in [Nunjucks](https://mozilla.github.io/nunjucks/) templates, with one namespace per file. For example, `{{ site.url }}` comes from `site.json`, and `{{ resources.title }}` comes from `content/resources.json`.

Both pages list their `##` and `###` headings in a table of contents. Each `##` heading needs to come before the `###` headings under it. In the FAQ, `##` headings group the questions, and each `###` heading is a question that visitors open to read the answer below it.

## Images

Put your images in `packages/config/public/`, such as `images/logo.svg`, `images/icon.png` and `images/social-share.jpg`. The build serves `packages/config/public/` from the site's root, over the files in `packages/web/public/`.

Give every content image and gallery photo descriptive alt text. See [Accessibility](accessibility.md) for the checklist and [Look and feel](look-and-feel.md) for logo and icon formats.

## See also

- [Schedule](schedule.md)
- [Edit on GitHub](edit-on-github.md)
- [Accessibility](accessibility.md)
- [Content model reference](../reference/content-model.md)
