module.exports = {
  statistics: [{
    counter: 500,
    caption: 'Attendees'
  }, {
    counter: 2,
    caption: 'Days'
  }, {
    counter: 40,
    caption: 'Sessions'
  }, {
    counter: 3,
    caption: 'Parallel tracks'
  }],
  callToAction: {
    text: 'GDG DevFest 2014',
    buttonText: 'See how it was',
    video: {
      id: 't95z_HLMTmM',
      title: 'GDG DevFest Ukraine 2014 - Highlights'
    }
  },
  galleryBlock: {
    title: 'GDG DevFest Ukraine 2014 - Photos',
    photos: {
      big: '../images/backgrounds/2015_1.jpg',
      small: ['../images/backgrounds/2015_2.jpg', '../images/backgrounds/2015_3.jpg']
    },
    albumUrl: 'https://plus.google.com/events/gallery/cc6tosp4ohkp6qj9pg5jb4g6o3k?sort=1'
  },
  ticketsBlock: {
    title: 'Tickets',
    tickets: [{
      name: 'Student',
      price: 400,
      currency: '₴',
      starts: 'May 1',
      ends: 'Sep 8',
      info: 'Requires valid student ID'
    }, {
      name: 'Early Bird',
      price: 700,
      currency: '₴',
      starts: 'May 1',
      ends: 'July 1',
      info: 'Or first 150 tickets',
      soldOut: true
    }, {
      name: 'Lazy Bird',
      price: 900,
      currency: '₴',
      starts: 'July 1',
      ends: 'Sep 8'
    }],
    details: 'Tickets grant access to all conference sections, coffee breaks, lunch and party. Accommodation is NOT included in the ticket price.'
  },
  socialFeed: {
    source: '/data/tweets.json'
  },
  partnershipProposition: 'http://bit.ly/df16-sponsor',
  teamPage: {
    title: 'About Us',
    icon: 'info',
    text: 'Google is known all around the world. Everyone is “googling”, checking on “maps” and communicating in “gmail”. For simple users, they are services that just works, but not for us. Developers see much more: APIs, scalability issues, complex technology stacks. And that is what GDG is about.<br><br> [Google Developers Group (GDG) Lviv](http://lviv.gdg.org.ua/) - is open and volunteer geek community who create exciting projects and share experience about Google technologies with a passion.<br><br> Our goal is to organize space to connect the best industry experts with Ukrainian audience to boost development of IT.'
  }
};
