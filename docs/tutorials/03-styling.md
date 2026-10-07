# Styling

Styling of your app can be found in `packages/web/src/styles/theme.ts`.

## Colors

Adjust the color scheme to your conference style.

```css
:host {
  --dark-primary-color: #512da8;
  --default-primary-color: #673ab7;
  --focused-color: #311b92;
  --light-primary-color: #d1c4e9;
  --text-primary-color: #fff;
  --accent-color: #ff5252;
  --primary-background-color: #fff;
  --primary-text-color: #424242;
  --secondary-text-color: #757575;
  --disabled-text-color: #bdbdbd;
  --divider-color: #ededed;
  ...
}
```

Some variables, such as `--box-shadow-primary-color`, `--primary-color-transparent` and `--primary-color-light`, repeat the primary color as `rgb(103 58 183 / ...)`. Update them too when you change `--default-primary-color`.

**Tip:** Choose base colors with [Material Palette][material palette]
![material_design_palette_generator](https://cloud.githubusercontent.com/assets/2954281/17750340/a02f8e76-64ca-11e6-80f0-53392b30f89a.png)

## Hero

Color and images for header can be configured via `packages/web/public/data/settings.json` in `heroSettings` object:

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

Edit Web app colors via `webapp` in `packages/web/public/data/settings.json`

```json
"webapp": {
  "shortName": "DevFest",
  "themeColor": "#F57C00",
  "backgroundColor": "#F57C00"
}
```

## Next steps

Learn how to [deploy the app to the web](04-deploy.md).

[material palette]: https://www.materialpalette.com/
