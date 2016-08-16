# Configure

The most important file of configuration is `data/hoverboard.config.json`
which looks like:

```
  "pages": {..},
  "navigation": [..],
  "url": "..",
  "mailchimp": {..},
  "partnershipProposition": "..",
  "languages": [..],
  "footerBlocks": [..],
  "contactBlock": {..},
  "tickets": {..},
  "teamPageTitle": "..",
  "teamPageText": "..",
  "statistics": [..],
  "hashtag": "..",
  "social": [..],
  "tweetsSource": "..",
  "gallery": {..},
  "location": {..},
  "videosSessionsUrl": "..",
  "callToAction": {..}
```

**Note**, the project supports localization using [AppLocalizeBehavior][
AppLocalizeBehavior], that's why some of config values are keys in
[localization resources][localization resources].


## Pages config

```
"pages": {
  "home": {
    "headerSettings": {
      "backgroundColor": "#FF9800",
      "backgroundImage": "/images/backgrounds/home.png",
      "fontColor": "#fff",
      "tabBarColor": "#fff",
      // data only applicable for the home page
      "video": {
        "title": "GDG DevFest Ukraine 2016",
        "youtubeId": "DfMnJAzOFng",
        "text": "See how it was in 2015"
      },
      // hides logo from the toolbar
      "hideLogo": true,
      // Is more like hack :)
      "minHeight": "360px"
    }
  },
  "blog": {
    "headerSettings": {
      "backgroundColor": "#03a9f4",
      "fontColor": "#fff",
      "tabBarColor": "#fff"
    }
  },
  ...
 }
```

If you don't need some pages, don't forget to remove them (or comment out)
in `hoverboard-app.html`

```
<neon-animated-pages attr-for-selected="name">

    <home-page name="home"></home-page>
    <blog-page name="blog"></blog-page>
    ...
<
```

And in navigation


## Navigation

```
"navigation": [
  {
    "route": "home",
    "permalink": "/"
  },
  {
    "route": "blog",
    "permalink": "/blog/"
  },
  ...
```

This configs reflects in `toolbar-block.html` and `drawer-block.html`

[AppLocalizeBehavior]: https://elements.polymer-project.org/elements/app-localize-behavior
[localization resources]: /data/en/resources.json
