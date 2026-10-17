# Accessibility

Keep your event's content, images, videos, venue details and custom colors accessible to every attendee.

**For:** [first-time organizers](../README.md#first-time-organizer), [returning organizers](../README.md#returning-organizer) and [content editors](../README.md#content-editor).

## Content checklist

Hoverboard's components and built-in themes are checked against WCAG 2.2 AA (see the [accessibility statement](../ACCESSIBILITY.md)). Your event's content needs the same care:

- **Describe images.** In Markdown, such as blog posts, the FAQ and the code of conduct, write `![what the image shows](/images/photo.jpg)`. Leave the brackets empty (`![]()`) only for a purely decorative image. Each `attendingPage` image needs `alt`. On the emulators, an image without alt text has a thick red outline so you can spot it before deploying.
- **Name partners.** A partner's logo is described by its `name` field, so use the name shown on the logo.
- **Describe gallery photos.** Give each photo in the `gallery` collection an `alt` field, such as "Attendees dance at the after party." Without it, screen readers hear "Gallery photo", and `./hb data check` warns.
- **Caption videos.** Videos play from YouTube, so add captions there, or check its automatic captions.
- **Start Markdown headings at `##`.** The page title is the only `#` heading. Don't skip a level, such as `##` straight to `####`.
- **Write links that make sense on their own**, such as "Read the travel guide" rather than "click here".
- **Tell people about the venue.** Fill in `attendingPage.accessibility`, and add a quiet room to `atVenue` if you have one. See [Attending page](attending-page.md).
- **Check your own colors.** The build checks the contrast of colors in `site.json` and stops when a pair fails. It does not check colors set in `packages/config/custom.css` or text over your own photos, so check those with a contrast checker. See [Look and feel](look-and-feel.md#colors).

## See also

- [Content](content.md)
- [Attending page](attending-page.md)
- [Look and feel](look-and-feel.md)
- [Accessibility statement](../ACCESSIBILITY.md)
