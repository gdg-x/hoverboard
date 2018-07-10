# Styling

Styling of your app can be found in `src/elements/shared-styles.html`.
 
### Colors
Adjust the color scheme to your conference style. 

```html
 /* Primary colors */
--dark-primary-color:       #F57C00;
--default-primary-color:    #FF9800;
--light-primary-color:      #FFE0B2;
--text-primary-color:       #212121; /* text / icons */

/* Accent colors */
--accent-color:             #03A9F4;

/* Background colors */
--primary-background-color:   #FFE0B2;

/* Text colors */
--primary-text-color:       #212121;
--secondary-text-color:     #727272;
--disabled-text-color:      #BDBDBD;

/* Other colors */
--divider-color:            #B6B6B6;

```

**Tip:** Choose base colors with [Material Palette][Material Palette]  
![material_design_palette_generator](https://cloud.githubusercontent.com/assets/2954281/17750340/a02f8e76-64ca-11e6-80f0-53392b30f89a.png)


### Hero

Color and images for header can be configured via `data/settings.json`
in `heroSettings` object:
```json
"heroSettings": {
  "home": {
    "description": "Be a hero. Be a GDG!",
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

### Web app

Edit Web app colors via `webapp` in `data/settings.json`
```json
"webapp": {
  "shortName": "DevFest",
  "themeColor": "#F57C00",
  "backgroundColor": "#F57C00"
}
```

## Next steps

Learn how to [deploy the app to the web](deploy.md).

[Material Palette]: https://www.materialpalette.com/
