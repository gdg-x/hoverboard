# Share images

Generate social preview images for every speaker and session page at build time, in your theme's colors and fonts.

**For:** [first-time organizers](../README.md#first-time-organizer) and [returning organizers](../README.md#returning-organizer). Serves speakers sharing their talk and prospective attendees seeing link previews on social networks and in chat apps.

## How share images work

`socialImages` (on by default in `features` in `packages/config/site.json`) builds a share image for each session and speaker page when the site is built:

- **Session image:** the session's title, speakers, day, time and track.
- **Speaker image:** the speaker's photo, name, company and the event's dates.
- **Shared branding:** the logo from `packages/config/public/images/logo.svg`, the venue and the site's address, in the theme's colors, fonts and speaker photo shape.

The build downloads speaker photos to include them. A photo that fails to download shows the speaker's initials instead, with a warning in the build output.

With `socialImages` off in `features`, session and speaker pages share the first speaker's photo or `image` from `packages/config/site.json`.

## Fonts in share images

Share images use the theme's `display` and `body` fonts. When you set custom fonts in `theme.fonts`, share images can read `.ttf`, `.otf` or `.woff` files with a single weight, such as `"weight": 700`. They can't read `.woff2` files, variable weights such as `"300 900"`, or a font service's stylesheet; with those, share images use the theme's built-in font and the build warns. See [Look and feel](look-and-feel.md#fonts). `packages/config/custom.css` is not used by share images.

## Updating and testing previews

Share images are generated from Firestore content at build time, like the rest of the static HTML. After changing sessions or speakers, deploy again to update them; see [How it works](../how-it-works.md#how-pages-are-built). Each image's file name changes with what it shows, so social networks fetch the new image automatically.

To check how a page looks when shared, paste its URL into the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).

## See also

- [Look and feel](look-and-feel.md)
- [Features reference](../reference/features.md)
