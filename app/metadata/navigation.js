module.exports = {
  navigation: [{
    route: 'home',
    permalink: '/',
    text: 'Home',
    heroSettings: {
      backgroundColor: '#00BCD4',
      backgroundImage: '/images/backgrounds/home.png',
      fontColor: '#FFFFFF',
      tabBarColor: '#FFFFFF',
      video: {
        title: 'GDG DevFest Ukraine 2015',
        youtubeId: 'DfMnJAzOFng',
        text: 'See how it was in 2015'
      }
    }
  }, {
    route: 'blog',
    permalink: '/blog',
    text: 'Blog',
    heroSettings: {
      backgroundColor: '#03A9F4',
      backgroundImage: '/images/backgrounds/blog.png',
      fontColor: '#FFFFFF',
      tabBarColor: '#FFFFFF'
    }
  }, {
    route: 'schedule',
    permalink: '/schedule',
    text: 'Schedule',
    heroSettings: {
      backgroundColor: '#607D8B',
      fontColor: '#FFFFFF',
      tabBarColor: '#FFFFFF'
    }
  }, {
    route: 'speakers',
    permalink: '/speakers',
    text: 'Speakers',
    heroSettings: {
      backgroundColor: '#673AB7',
      fontColor: '#FFFFFF',
      tabBarColor: '#FFFFFF'
    }
  }]
};
