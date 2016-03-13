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
      currency: 'UAH',
      info: '*Before October 23 or 100 tickets.<br/>Requires valid student ID'
    }, {
      name: 'Early Bird',
      price: 600,
      currency: 'UAH',
      info: '*Before September 27 or 150 tickets',
      soldOut: true
    }, {
      name: 'Lazy Bird',
      price: 800,
      currency: 'UAH',
      info: '*Before October 23'
    }],
    details: 'Tickets grant access to all conference sections, coffee breaks, lunch and party. Accommodation is NOT included in the ticket price.'
  },
  socialFeed: {
    source: '/data/tweets.json'
  },
  partnershipProposition: '/assets/GDG_DevFest_Ukraine_2015_Partnership_Proposition.pdf'
};
