# Styling

Styling of your app can be found in `src/styles/shared-styles.html`.
 
### Colors
Generate your own color scheme with [Material Palette][Material Palette]
and click download Polymer
![material_design_palette_generator](https://cloud.githubusercontent.com/assets/2954281/17750340/a02f8e76-64ca-11e6-80f0-53392b30f89a.png)

Now Replace next section
```
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


### Tags

Additionally it's possible to edit/add tags which is used on speakers and session
```
/* Tags colors */
--general: #bdbdbd;
--android: #78c257;
--web: #2196f3;
--cloud: #3f51b5;
--community: #e91e63;
--angular-js: #e0343d;
... 
```


### Headers

Color and images for header can be configured via `data/hoverboard.config.json`
in `pages` object. For instance:
```
"pages": {
  "home": {
    "headerSettings": {
      "backgroundColor": "#03a9f4",
      "backgroundImage": "/images/backgrounds/home.png",
      "fontColor": "#fff",
      "tabBarColor": "#fff"
    }
  },
  ...
 }
```

### Web app

Edit Web app colors in `hoverboard.config.json`
```
  "webapp": {
      "shortName": "DevFest",
      "themeColor": "#F57C00",
      "backgroundColor": "#F57C00"
    }
```

## Next steps

Learn how to [deploy the app to the web](deploy.md).

[Material Palette]: https://www.materialpalette.com/
