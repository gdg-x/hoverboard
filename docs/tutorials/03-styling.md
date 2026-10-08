# Styling

Colors, fonts and shapes come from a theme. Pick it and change it in `theme` in `packages/config/site.json`. Shared styles, such as the type scale, spacing and motion, are in `packages/web/src/styles/base.css`.

## Themes

Hoverboard has two built-in themes, `festival` (the default) and `spotlight`. Each has light and dark colors.

```json
"theme": {
  "name": "festival",
  "colorScheme": "system",
  "density": "default",
  "decorations": true
}
```

- `colorScheme` is `system`, `light` or `dark`. With `system`, the site follows the visitor's device setting, and visitors can pick System, Light or Dark under Appearance in the footer. Their browser remembers the choice. `light` and `dark` lock the site to one scheme and hide the footer choice.
- `density` is `compact`, `default` or `roomy`. It scales the spacing.
- `decorations` turns the theme's decorative shapes and illustrations on or off.

The themes are in `packages/web/src/themes/`. The header and footer use them. Other components still use the colors of the old design, and move to the new themes in later releases.

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

The color names are in `packages/web/src/themes/tokens.ts`, and their values in `festival.ts` and `spotlight.ts`. The build writes them on `:root` in every page as CSS variables, such as `--hb-color-primary`, so the first paint already has your colors.

The build checks that text colors have enough contrast with their backgrounds, in each color scheme the site uses. For example, `onPrimary` on `primary` needs a ratio of 4.5:1. When a pair fails, `npm run build` and `./hbd validate-config` stop with an error like this:

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

## Hero

The home page hero image is `heroSettings.home.background.image` in `packages/config/site.json`:

```json
"heroSettings": {
  "home": {
    "background": {
      "image": "/images/backgrounds/home.jpg"
    }
  }
}
```

The text under the hero titles is `heroDescriptions` in `packages/config/content/resources.json` ([Pages configuration](01-configure-app.md#pages-configuration)).

## Text

Styling does not change the text. [Text and languages](01-configure-app.md#text-and-languages) lists where each kind of text is edited. Translated text is often longer than English, so leave room for it to wrap in custom styles. No other language ships yet, so this is not checked (verify).

## Next steps

Learn how to [deploy the app to the web](04-deploy.md).
