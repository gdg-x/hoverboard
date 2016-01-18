module.exports = {
    navigation: [{
        route: 'home',
        permalink: '/',
        text: 'Home',
        heroSettings: {
            backgroundColor: '#009688',
            backgroundImage: '/images/backgrounds/home.png',
            fontColor: '#FFFFFF',
            tabBarColor: '#FFFFFF',
            video: {
                title: 'GDG DevFest Ukraine 2015',
                youtubeId: '_yhIH9wb3hE',
                text: 'Watch the promo-video'
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
