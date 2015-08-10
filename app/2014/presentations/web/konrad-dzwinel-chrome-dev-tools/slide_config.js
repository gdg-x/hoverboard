var SLIDE_CONFIG = {
  // Slide settings
  settings: {
    title: 'Front-End Tools Beyond DevTools',
    subtitle: '',
    eventInfo: {
      title: 'DevFest Ukraine',
      date: '25.10.2014'
    },
    useBuilds: true, // Default: true. False will turn off slide animation builds.
    usePrettify: true, // Default: true
    enableSlideAreas: true, // Default: true. False turns off the click areas on either slide of the slides.
    enableTouch: false, // Default: true. If touch support should enabled. Note: the device must support touch.
    //analytics: 'UA-XXXXXXXX-1', // TODO: Using this breaks GA for some reason (probably requirejs). Update your tracking code in template.html instead.
    favIcon: 'images/mw/favicon.png',
    fonts: [
      'Open Sans:regular,semibold,italic,italicsemibold',
      'Source Code Pro'
    ],
    theme: ['mw', 'layers'] // Add your own custom themes or styles in /theme/css. Leave off the .css extension.
  },

  // Author information
  presenters: [{
    name: 'Konrad Dzwinel',
    company: 'Front-End Developer<br>Making Waves',
    gplus: 'https://www.google.com/+KonradDzwinel',
    twitter: '@kdzwinel',
//    www: 'http://www.you.com',
    github: 'http://github.com/kdzwinel'
  }]
};

