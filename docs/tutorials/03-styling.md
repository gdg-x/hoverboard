# Styling

Colors come from a theme. Pick it and change its colors in `theme` in `packages/config/site.json`. Shared styles, such as layout, animation and shadows, are in `packages/web/src/styles/theme.ts`.

## Colors

Hoverboard has one built-in theme, `default`. Override any of its colors in `theme.colors`, as a hex color:

```json
"theme": {
  "name": "default",
  "colors": {
    "primary": "#f57c00",
    "primaryDark": "#e65100"
  }
}
```

The colors and their defaults are in `packages/web/src/themes/default.ts`. `packages/web/src/themes/tokens.ts` lists the CSS variable that each one sets. The build writes them on `:root` in `index.html`, so the first paint already has your colors.

Lighter and transparent versions of the primary color, such as `--light-primary-color`, `--primary-color-transparent` and `--box-shadow-primary-color`, are derived from `primary`, so you only change it in one place. The browser theme color, the home screen app colors and the Windows tile color are `primary` too.

The home page hero uses `primary` as its background and `onPrimary` for its text. Other page heroes use `background` and `text`.

**Tip:** Choose base colors with [Material Palette][material palette]
![material_design_palette_generator](https://cloud.githubusercontent.com/assets/2954281/17750340/a02f8e76-64ca-11e6-80f0-53392b30f89a.png)

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

[material palette]: https://www.materialpalette.com/
