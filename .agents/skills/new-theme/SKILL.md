---
name: new-theme
description: 'Create a new Hoverboard theme. Use when asked to add, make, create or design a new theme, a theme with a given look ("add a new theme with neon colors", "a retro theme", "a theme like our brand"), to restyle or brand the site, or for a new base or built-in theme. By default makes a custom event theme for the site in packages/config (site.json colors and fonts, plus custom.css). Makes a new base theme in packages/web/src/themes only when asked for a base, built-in or upstream theme.'
argument-hint: 'The look you want, such as "neon arcade with pixel fonts"'
---

# New theme

Turns a description of a look into a Hoverboard theme. There are two kinds:

| Kind                             | When                                                                                                                            | Where                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Custom event theme** (default) | Anything else, including "add a new theme with xyz"                                                                             | `packages/config/site.json` (`theme`) and `packages/config/custom.css`, over a base theme |
| **Base theme**                   | The user says base, built-in or upstream theme, or wants it in the demo's theme picker, `./hb init` or the theme list for forks | `packages/web/src/themes/<name>.ts` and the places that list the themes                   |

If the request is unclear, make a custom event theme and say that a base theme is the other option.

Read [docs/tutorials/03-styling.md](../../../docs/tutorials/03-styling.md) first. It describes the four base themes, `site.json` theme settings, fonts and the CSS variables a theme sets.

## 1. Write a short brief

Before editing, write the brief in the chat:

- **Concept**: one line, such as "a neon arcade at night".
- **Base theme**: the closest of `festival` (bold poster), `spotlight` (dark stage, centered), `paper` (sketchbook, serif) or `glass` (frosted panels). A custom theme starts from it. A base theme copies its file.
- **One choice per facet**: type (display font, weight, tracking), shape (corners, control shape), edges (borders, shadows), layout (hero columns and alignment, section headers), sections (tones, patterns, edges, inset panels), header (pill or bar), images (avatar shape, filter, frames), stickers, motion (easing, press, hover).
- **Color scheme**: `system`, or `light` or `dark` when the look only works in one.

A new base theme also needs at least one signature the four base themes don't have, such as its own display font, header shape, section style or sticker shape.

## 2a. Custom event theme

1. Check that `packages/config/site.json` exists. If it doesn't, the repository has no site of its own yet. `./hb init` creates it, but it changes production, so don't run it. Ask the user whether to make a base theme instead, or stop. Don't put a custom event theme in `packages/demo-config`, which is upstream's demo site.
2. In `site.json`, under `theme`:
   - `name`: the base theme from the brief.
   - `colors` and `darkColors`: hex values for the color roles in `COLOR_ROLES` in `packages/web/src/themes/tokens.ts`. Change a text role with its background role (`primary` with `onPrimary`, `accent1Container` with `onAccent1Container`). Without a dark color, the build makes one with the same hue.
   - `fonts`: `display`, `body`, `mono` or `accent`. Use font files in `packages/config/fonts` (`.woff2`, plus `.woff`, `.ttf` or `.otf` at one weight for share images), a font service `stylesheet`, or a font list already on devices. Check the font's license allows self-hosting. A font service's address must be allowed in `security.csp` (see `docs/tutorials/01-configure-app.md`).
   - `colorScheme`, `density` and `decorations` as the brief says.
3. In `packages/config/custom.css`, set `--hb-*` variables on `:root` for everything else: shapes, layout, header, sections, images, stickers and motion. The variables and what they do are in the custom CSS section of `03-styling.md`. Every key of `ThemeStyle` in `tokens.ts` is a variable (`radiusControl` is `--hb-radius-control`), and so are the tone variables, `--hb-tone-<tone>-background`, `-color` and `-pattern`. Rules:
   - Colors only as `var(--hb-color-*)`, never literals, so the build's contrast check and the dark scheme still apply. Pair a background role with its text role.
   - Patterns, textures and edges are CSS gradients or `data:` SVG URLs under 2KB, drawn in `currentColor` at 14% or less. Other origins are blocked by the Content Security Policy.
   - The file can't contain `</style`.
4. Run `./hb config validate`. It checks the schema, the color contrast in each scheme the site uses, and the fonts.

Limits to tell the user about: share images use the site's colors, fonts and the base theme's avatar style, but don't read `custom.css`. With `decorations` off, `base.css` turns off patterns, edges, textures, frames and tilts, whatever `custom.css` sets.

## 2b. Base theme

1. **Fonts.** Use a font from `BUILT_IN_FONTS` in `packages/web/src/themes/fonts.ts`, or add one:
   - It must be under the SIL Open Font License with Latin and Cyrillic subsets, with an `@fontsource-variable/<id>` package.
   - `npm install --prefix packages/web @fontsource-variable/<id>`. For the display or body role, add the static `@fontsource/<id>` too, since share images need `.woff` files.
   - Add it to `BUILT_IN_FONTS` with its `@capsizecss/metrics` module name (check it exists) and `generic`. Set `italic: true` only if the theme uses italic.
   - Keep the home page under 4 font files and 160KB of Latin files on first load.
2. **Theme file.** Copy the closest theme to `packages/web/src/themes/<name>.ts` and change every value. Each key's meaning is in the doc comments of `ThemeStyle`, `ToneColors` and `ShareStyle` in `tokens.ts`.
   - `light` and `dark`: every color role, as hex. Hex colors are only allowed in `src/themes/`.
   - `style`: colors only as `var(--hb-color-*)`. `heroPattern`, `bandEdge`, `pageTexture` and the tone patterns follow the pattern rules above, and must not use `var(--hb-color-*)`. Reuse `dots`, `stripes` and `grid` from `tokens.ts` where they fit.
   - `tones`: a background and text color role for each tone, and an optional pattern.
   - `share`: what share images draw, in pixels at a 280px avatar, degrees and color roles.
   - `colorScheme` and `fonts`.
   - Only Baseline CSS that Chrome, Safari and Firefox all support. No `corner-shape` and no container style queries.
3. **Register it** in the places that list the themes:
   - `THEMES` in `packages/web/src/themes/index.ts`.
   - `enum` and `enumDescriptions` of `theme.name` in `packages/web/schemas/site.schema.json`, in the same order as `THEMES`. The description is one sentence: `./hb init` prints it and VS Code shows it.
   - The theme names in `packages/web/src/styles/theme.test.ts` (the test that no component names a theme) and `packages/web/src/components/shell/demo-banner.test.ts`.
4. **Components never check the theme's name.** When the look needs something no variable controls, add a `ThemeStyle` key: give every theme a value that keeps its look, read it in the component as `var(--hb-<key>)`, and add the decorations-off and forced-colors overrides to `packages/web/src/styles/base.css` if it is a decoration. Fonts in components go through `displayFont()` in `packages/web/src/styles/shared.ts`.
5. **Docs.** Add a section with a paragraph and a screenshot to the Themes section of `docs/tutorials/03-styling.md`, like the other themes. Mention the theme where that file lists themes, such as the hero patterns and fonts.

## 3. Check it

1. `npm run lint` and `npm test`, or at least `npx vitest run --project Web --project Server --project Hydration` and `./hb config validate`. The `Web` tests check contrast in both schemes, the pattern rules, that every token is written, and that decorations turn off.
   - For a base theme, also `npx vitest run --project A11y`. It runs axe on every page in every built-in theme, light and dark, so it covers the new one.
2. Look at it in a browser:
   - Start an emulator: `npx firebase emulators:start --only firestore --project=demo-hoverboard` (keep it running).
   - `./hb data seed --yes`, then `npm run build`.
   - Serve: `python3 -m http.server 5180 --directory packages/web/dist`.
   - For a base theme, pick it with `localStorage.setItem('hb-demo-theme', '<name>')` and reload. `hb-color-scheme` (`light` or `dark`) and `hb-demo-decorations` (`off`) switch the rest.
   - Check the home page in light and dark, at 375px and 1280px, with decorations off, and in forced colors. Scroll the whole page so lazy sections load. Check that section titles line up, the hero fits, and text over patterns is readable.
   - For the docs screenshot, remove `demo-banner` and `app-overlays`, take the top 720px, and save it with `sharp` as `docs/images/themes/<name>.webp` (WebP, quality 80, under 50KB).
   - Stop the emulator and the server, and clear the `localStorage` keys.
3. Summarize the brief, what each facet became, and what the theme couldn't do. A base theme's pull request title is `feat(web): add <name> theme`.
