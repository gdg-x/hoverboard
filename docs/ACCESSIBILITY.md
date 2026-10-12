# Accessibility

Hoverboard is a template for conference websites, so an accessibility problem in it is in every site built from it. We want every attendee to be able to read the schedule, find a session, bookmark it, sign in and give feedback, whatever device or assistive technology they use.

## Our goal

Hoverboard aims to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA in every built-in theme, in light and dark, with any set of features turned on or off.

Hoverboard 4 has not had a full accessibility audit yet. One is planned before the 4.0 release, and its results will be added to this page. Until then, treat the goal as a goal, not a claim of conformance.

## What Hoverboard does today

- **Contrast.** Every built-in theme's text and control colors are checked against WCAG contrast ratios in light and dark, and so is the focus ring on every background it can sit on. A site's own colors in `site.json` are checked too, and the build stops when a pair fails.
- **Keyboard.** A skip link to the main content, a visible focus ring on every control, and dialogs that keep focus inside them and close with Escape.
- **Targets.** Buttons, links styled as buttons, chips, switches and fields are at least 24 pixels tall, whatever the theme and density.
- **Structure.** Pages use landmarks, headings and native controls. The tests find elements by their role and accessible name, so a missing name fails a test.
- **Motion.** Animations, confetti, tilts and page transitions stop when the visitor's device asks for reduced motion.
- **Visual settings.** Forced colors (such as Windows Contrast themes) remove decorative patterns, textures and frames. Reduced transparency makes the `glass` theme solid. Organizers can turn decorations off with `decorations: false`.
- **Language.** The page's `lang` follows the locale, and the interface text is translatable. A longer pseudo-locale checks that translated text has room.

## Supported environments

We aim to support the current versions of Chrome, Edge, Firefox and Safari on desktop and mobile, with:

- NVDA with Firefox on Windows
- VoiceOver with Safari on macOS and iOS
- TalkBack with Chrome on Android
- Keyboard only, browser zoom up to 400%, screens as narrow as 320px, and forced colors

## Known barriers

The automated checks list what they find in [accessibility-issues.md](accessibility-issues.md). The audit will also check these areas first:

- Sticky bars on the schedule (the day tabs, track names and times) covering the focused session.
- The schedule grid, which scrolls sideways, with a keyboard and a screen reader.
- FAQ questions, which are headings inside expandable sections.
- Status messages, such as filter result counts and toasts, being announced.
- Handwriting and condensed display fonts in some themes, with increased text spacing.

Barriers the audit confirms will be added to that list.

## Your event's site

Each site is run by its organizers, who also write its content. Some of what makes a site accessible is up to them:

- Alt text for the logo, partner logos, photos and blog post images.
- Captions for videos.
- Accessibility information about the venue, on the attending page.
- Contrast of their own colors and photos. The build checks the colors in `site.json`, but not colors set in `custom.css`.
- Clear link text in their content.

If you have a problem with one event's site, contact its organizers first. If the problem is in Hoverboard itself, report it here.

## Reporting a barrier

[Open an issue](https://github.com/gdg-x/hoverboard/issues/new?template=bug_report.md) and start the title with "Accessibility:". Include:

- The page, or its URL on the [demo site](https://hoverboard-master.web.app)
- The theme and color scheme, if you know them
- Your browser, device and assistive technology, with versions
- What you tried to do, what happened, and what you expected

Report security problems privately instead, as [SECURITY.md](../.github/SECURITY.md) describes.

## For contributors

Changes to the web app keep it accessible:

- Use native elements (`<button>`, `<a>`, `<dialog>`, `<details>`) before ARIA, and give every control an accessible name.
- Write tests that find elements by role and name.
- Don't carry meaning by color or shape alone, and use the theme's color tokens, so the contrast check covers them.
- Keep a visible focus ring, and make sure sticky elements don't hide focused ones.
- Make touch targets at least 24 by 24 pixels.
- Respect reduced motion for anything that moves.
- Put interface text in `msg()`, so it can be translated, and leave room for longer text.
- Try a change with the keyboard, and in forced colors when it changes how something looks.

[AGENTS.md](../AGENTS.md) has the project's conventions.

## Ownership and maintenance

Hoverboard's maintainers are volunteers. They triage accessibility reports with other issues, and fix barriers that stop someone from completing a task before other bugs. Barriers like that, found in an audit, are fixed before a major release.

This page is reviewed for each major release.
