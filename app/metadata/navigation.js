module.exports = {
  navigation: [{
    route: '',
    permalink: '/',
    text: 'Home',
    headerSettings: {
      backgroundColor: '#607D8B',
      backgroundImage: '/images/backgrounds/home.png',
      fontColor: '#FFFFFF',
      tabBarColor: '#FFFFFF',
      hideLogo: true,
      minHeight: '360px'
    }
  }, {
    route: 'blog',
    permalink: '/blog/',
    text: 'Blog',
    headerSettings: {
      backgroundColor: '#03A9F4',
      fontColor: '#FFFFFF',
      tabBarColor: '#FFFFFF'
    }
  }, {
    route: 'speakers',
    permalink: '/speakers/',
    text: 'Speakers',
    headerSettings: {
      backgroundColor: '#673AB7',
      fontColor: '#FFFFFF',
      tabBarColor: '#FFFFFF'
    }
  }]
};
