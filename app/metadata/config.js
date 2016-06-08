var config = require('../../config');

module.exports = {
  baseurl: '',
  url: 'https://hoverboard.firebaseapp.com/',
  // Google Analytics code
  trackerCode: 'UA-43643469-8',
  // Google Webmaster Tools verification code
  webtoolsCode: 'YOUR_WEBTOOLS_CODE',
  // Mailchimp subscribe
  mailchimp: {
    url: 'YOUR_MAILCHIMP_URL',
    name: 'YOUR_MAILCHIMP_NAME'
  },
  // Disqus comments
  disqusShortName: 'hoverboard-gdg-x',
  // Add to homescreen for Chrome on Android
  applicationName: config.appName,
  // Add to homescreen for Safari on iOS
  appleMobileWebAppTitle: config.appName
};
