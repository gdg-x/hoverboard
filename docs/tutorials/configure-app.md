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
AppLocalizeBehavior], that's why some of the config values are keys in
[localization resources][localization resources].

### SEO
The project doesn't use any generators, so there is a need to edit manually
meta data in `index.html`
```
<head>
  <meta name="description"
        content="The biggest Google tech conference in Ukraine carefully crafted for you by GDG community! All about Android, Web and Cloud from the world experts">
  <meta name="keywords"
        content="event, gdg, gde, devfest, google, programming, android, chrome, polymer, developers, web, cloud, androiddev">
  <meta name="author" content="GDG Lviv">

  <title>GDG DevFest Ukraine 2016</title>
  ...
```

### Google Analytics
Replace GA tracking code in `index.html`
```
trackingId: window.ENV === 'prod' ? 'UA-43643469-8' : 'UA-43643469-9'
```

It's possible to have analytics for development and production. Select
your environment on line:
```
window.ENV = 'dev';
```

### Pages config

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


### Navigation

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

### Tweets
```
"tweetsSource": "/data/tweets.json",
```
To make it more dynamic use [Tweetledee](http://chrissimpkins.github.io/tweetledee/)
which provides ready-bake PHP files that allow you to access Twitter user 
timelines, user favorites, lists, home timelines, and tweet search data in a JSON.
```
"tweetsSource": "https://<YOUR_APP>.herokuapp.com/favoritesjson.php?c=10&cache_interval=8000",
```
You can install Tweetledee on [Heroku](https://www.heroku.com/).
Download the latest version of Tweetledee; unzip and deploy on their server.  
**Note:** don't forget to enable CORS, changing `$TLD_JS = 0;` to `$TLD_JS = 1;`.  
Read [full documentation](http://chrissimpkins.github.io/tweetledee/) on the official website.


# Next steps

Now your Hoverboard is up configured, learn how to [style app][style app] and [deploy][deploy].

[AppLocalizeBehavior]: https://elements.polymer-project.org/elements/app-localize-behavior
[localization resources]: /data/en/resources.json
[style app]: styling.md
[deploy]: deploy.md
