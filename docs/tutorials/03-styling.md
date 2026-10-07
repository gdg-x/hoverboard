# Styling

Theme colors are in `packages/web/src/themes/default.ts`. Shared styles, such as layout, animation and shadows, are in `packages/web/src/styles/theme.ts`.

## Colors

Adjust the color scheme to your conference style.

```css
:host {
  --default-primary-color: #673ab7;
  --dark-primary-color: #512da8;
  --focused-color: #311b92;
  --accent-color: #ff5252;
  --text-primary-color: #fff;
  --primary-background-color: #fff;
  --primary-text-color: #424242;
  --secondary-text-color: #757575;
  --disabled-text-color: #bdbdbd;
  --divider-color: #ededed;
  ...
}
```

Lighter and transparent versions of the primary color, such as `--light-primary-color`, `--primary-color-transparent` and `--box-shadow-primary-color`, are derived from `--default-primary-color`, so you only change it in one place.

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

Color and images for header can be configured via `packages/config/site.json` in `heroSettings` object:

```json
"heroSettings": {
  "home": {
    "description": "Join the commuity, learn new things!",
    "background": {
      "color": "#673ab7",
      "image": "/images/backgrounds/home.jpg"
    },
    "fontColor": "#FFF"
  },
  "blog": {
    "title": "Blog",
    "metaDescription": "Read stories from our team",
    "background": {
      "color": "#FFF"
    },
    "fontColor": "#424242"
  },
  ...
 }
```

## Web app

Edit Web app colors via `webapp` in `packages/config/site.json`

```json
"webapp": {
  "themeColor": "#F57C00",
  "backgroundColor": "#F57C00"
}
```

## Next steps

Learn how to [deploy the app to the web](04-deploy.md).

[material palette]: https://www.materialpalette.com/
