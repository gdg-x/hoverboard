# Languages

Configure the site's default language and target locales in `packages/config/site.json`, and translate your event's text and Markdown pages.

**For:** [first-time organizers](../README.md#first-time-organizer), [returning organizers](../README.md#returning-organizer) and [content editors](../README.md#content-editor).

## Site languages

`locales` in `packages/config/site.json` sets the languages of the site. `source` is the default locale and the language of your content in `packages/config/content/`. The pages and `manifest.json` are built in this language, and their `lang` is set to it. In a visitor's browser, the page switches to their language once it has loaded.

`targets` lists the other locales that visitors can pick in the footer. Every locale other than `en` needs UI translations in `packages/translations/xliff/`, and the build fails without them. None ship yet, so sites are in English only:

```json
"locales": { "source": "en", "targets": [] }
```

The app picks a visitor's language in this order:

1. The one they picked before in the footer.
1. The first of their browser's languages that the site offers (a language with a region, such as `es-MX`, matches `es`).
1. `source`.

The picker in the footer shows only when the site offers more than one language, and the browser remembers the choice. A language downloads the first time a visitor picks it, and works offline after that.

Dates and numbers follow the visitor's language. Session days and times stay in `event.timezone`, unless a visitor switches the schedule to their own time zone.

These are not translated: data in Firestore, blog posts, push notifications, `manifest.json`, and the page titles and descriptions that search engines and link previews read. See [How it works](../how-it-works.md#where-text-comes-from) for how UI text and event text are separated.

## Translating event content

Translate your event content for a target locale in `packages/config/content/locales/<locale>/resources.json`. It takes the same keys as `content/resources.json`, and only the ones you translate. Objects merge with `content/resources.json`, and lists replace it. A key you leave out shows the text in `source`. The build fails on a key that is not in `content/resources.json`, and on a folder whose locale is not in `targets`.

```json
{
  "title": "DevFest Ucrania",
  "aboutBlock": { "statisticsBlock": { "days": { "label": "Días" } } }
}
```

Translate the FAQ and Code of Conduct pages with `faq.md` and `coc.md` in the same folder. A page without a translation shows `content/faq.md` or `content/coc.md`. The build fails on any other file in the folder.

Since lists replace, translating one item of `attendingPage.gettingThere`, `doors`, `accommodation.hotels` or `atVenue` means copying the whole list. Keep each door's `day`, `open` and `close`, which the build checks in translations too.

## See also

- [Content](content.md)
- [How it works](../how-it-works.md#where-text-comes-from)
- [Translations package](../../packages/translations/README.md)
