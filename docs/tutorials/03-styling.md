# Styling

Colors, fonts and shapes come from a theme. Pick it and change it in `theme` in `packages/config/site.json`. Shared styles, such as the type scale, spacing and motion, are in `packages/web/src/styles/base.css`.

## Themes

Hoverboard has four built-in themes. Each has light and dark colors.

- `festival` (the default): paper colors, ink outlines, hard shadows and pastel bands in four accent colors.
- `spotlight`: no outlines, soft shadows and one bright yellow color for the main buttons.
- `paper`: white paper, light gray pencil outlines, nearly square corners and soft watercolor colors.
- `glass`: modeled on Apple's Liquid Glass. Frosted, see-through cards and bars over soft color glows, large round corners and Inter for headings. Visitors who turn on reduced transparency on their device get solid colors instead.

```json
"theme": {
  "name": "festival",
  "colorScheme": "system",
  "density": "default",
  "decorations": true
}
```

- `colorScheme` is `system`, `light` or `dark`. With `system`, the site follows the visitor's device setting, and visitors can pick System, Light or Dark under Appearance in the footer. Their browser remembers the choice. `light` and `dark` lock the site to one scheme and hide the footer choice.
- `density` is `compact`, `default` or `roomy`. It scales the spacing, not the text or button sizes.
- `decorations` turns the playful details on or off: dot patterns, tilted stickers and photos, confetti when a visitor bookmarks a session, and the home page illustration. With `false`, the layout stays the same, with plain colors and straight labels. Visitors who ask their device for reduced motion never see the motion.

The themes are in `packages/web/src/themes/`. `./hb init` asks which one to use.

## Custom CSS

Every component reads the theme through CSS variables that start with `--hb-`, such as `--hb-color-primary`, `--hb-space-4` and `--hb-radius-m`. Use them in your own styles, so they follow the theme and the dark scheme. The variables of Hoverboard 3, such as `--default-primary-color`, are gone.

## Logo

The header shows `packages/web/public/images/logo.svg`, made for light backgrounds. Add `logo-dark.svg` next to it for the dark scheme. Without it, the header shows `shortName` from `site.json` as text in the dark scheme.

## Colors

Override any theme color in `theme.colors`, as a hex color. Dark colors are in `theme.darkColors`:

```json
"theme": {
  "colors": {
    "primary": "#c2185b",
    "onPrimary": "#ffffff"
  },
  "darkColors": {
    "primary": "#ff8fb8"
  }
}
```

When you change a light color and not its dark version, the build makes a dark version with the same hue, as light as the theme's dark color.

The color names are in `packages/web/src/themes/tokens.ts`, and their values in `festival.ts`, `spotlight.ts`, `paper.ts` and `glass.ts`. The build writes them on `:root` in every page as CSS variables, such as `--hb-color-primary`, so the first paint already has your colors.

The build checks that text colors have enough contrast with their backgrounds, in each color scheme the site uses. For example, `onPrimary` on `primary` needs a ratio of 4.5:1. When a pair fails, `npm run build` and `./hb validate-config` stop with an error like this:

```text
site.json/theme: onPrimary on primary has a contrast of 2.02:1 in the dark scheme, and needs 4.5:1. Change theme.darkColors.
```

The browser theme color is `primary`, in light and dark. The home screen app colors and the Windows tile color are the light `primary`.

## Fonts

The built-in themes use [Unbounded](https://fonts.google.com/specimen/Unbounded) for headings, [Inter](https://rsms.me/inter/) for text and [JetBrains Mono](https://www.jetbrains.com/lp/mono/) for times and code. The site serves them itself, so they also work offline.

Change a font with `theme.fonts.display`, `body` or `mono`. Hoverboard assumes you have the right to use the font. Use one of these:

- Font files in `packages/config`. Use `.woff2` files where you can.

  ```json
  "fonts": {
    "display": {
      "family": "Brand Sans",
      "files": [{ "src": "fonts/brand-sans.woff2", "weight": "300 900" }],
      "scale": 0.9
    }
  }
  ```

- A font service stylesheet, such as Google Fonts or Adobe Fonts:

  ```json
  "fonts": {
    "body": {
      "family": "Atkinson Hyperlegible",
      "stylesheet": "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap"
    }
  }
  ```

- Fonts already on the device, as a CSS font list: `{ "family": "ui-monospace, Menlo, monospace" }`.

`scale` multiplies the heading sizes, from 0.75 to 1.25, for very wide or narrow fonts.

For font files, the build adds a fallback font with the same size, so the text does not move when the font loads. It warns when a role's files are over 150KB, and when the font has no glyphs for characters in the event name and title (verify with a font of your own).

## Tags and badges

Session tag colors are set by tag name in `theme.tagColors` in `packages/config/site.json`. Name each one like the tag in lowercase, with dashes instead of spaces. Speaker badge colors are in `theme.badgeColors`.

The tag color marks the stripe on a session card. Tag chips use a pale version of it with dark text, and a deep version with light text in the dark scheme, which the build makes from the color, so any color stays readable.

```json
"theme": {
  "tagColors": {
    "android": "#78c257",
    "web": "#2196f3"
  },
  "badgeColors": {
    "gde": "#3d5afe"
  }
}
```

## Illustrations

The drawings in the home hero, the subscribe band, the 404 and offline pages, the sign-in dialog, the feedback form, an empty My Schedule and filters with no results come from [unDraw](https://undraw.co/illustrations). Thanks to Katerina Limpitsouni for them. Their [license](https://undraw.co/license) needs no credit.

They follow the theme: the accent is the theme's `primary` color, and the grays are the surface and text colors, so they also switch with the dark scheme. Only skin tones keep their own colors. With `decorations` off, the hero and subscribe band drawings are hidden; the others stay, because they explain an empty or error state.

To change one, download an SVG from unDraw and run:

```console
npm --prefix packages/web run illustrations -- ~/Downloads/drawing.svg not-found
```

It optimizes the SVG and replaces its colors with theme colors, and writes `packages/web/src/illustrations/not-found.svg`. It stops on a color it does not know, so add that color to `build/illustrations.mjs`. A test checks that every illustration went through the script and is under 15KB.

## Hero

The home page hero uses the theme's first accent color with a dot pattern. `heroSettings.home` in `packages/config/site.json` can add an illustration or a background photo ([Pages configuration](01-configure-app.md#pages-configuration)). With a photo, the build checks that the dark scheme's `onSurface` text is readable on its `scrim` over a white photo. If it is not, set a darker `theme.darkColors.scrim`.

Other pages start with a smaller band in one of the theme's accent colors, the same for each section: speakers in the first accent color, the blog in the second, the schedule in the third and the team in the fourth.

The home page sections below the hero alternate between the surface color and the accent colors, whichever features are on. The subscribe band always uses the third accent color.

The text under the hero titles is `heroDescriptions` in `packages/config/content/resources.json` ([Pages configuration](01-configure-app.md#pages-configuration)).

## Text

Styling does not change the text. [Text and languages](01-configure-app.md#text-and-languages) lists where each kind of text is edited. Translated text is often longer than English, so leave room for it to wrap in custom styles. No other language ships yet, so this is not checked (verify).

## Next steps

Learn how to [deploy the app to the web](04-deploy.md).
