var execSync = require('child_process').execSync,
  appVersion = null;

try {
  appVersion = execSync('git describe --tags').toString().replace(/(\r\n|\n|\r)/gm, '');
} catch(e) {
  console.log('Warning: Can\'t run "git describe" for determine app version');
}

module.exports = {
  // Autoprefixer
  autoprefixer: {
    // https://github.com/postcss/autoprefixer#browsers
    browsers: [
      // Setup for WebComponents Browser Support
      // https://github.com/WebComponents/webcomponentsjs#browser-support
      'Explorer >= 10',
      'ExplorerMobile >= 10',
      'Firefox >= 30',
      'Chrome >= 34',
      'Safari >= 7',
      'Opera >= 23',
      'iOS >= 7',
      'Android >= 4.4',
      'BlackBerry >= 10'
    ]
  },
  // BrowserSync
  browserSync: {
    browser: 'default', // or ["google chrome", "firefox"]
    https: false, // Enable https for localhost development.
    notify: false, // The small pop-over notifications in the browser.
    port: process.env.PORT || 3000, // Environment variable $PORT is for Cloud9 IDE
    ui: {
      port: 3001
    }
  },
  // Deploy task
  deploy: {
    // Choose hosting
    hosting: 'firebase', // or firebase, gcs, ssh, ghp
    // Firebase
    // Firebase requires Firebase Command Line Tools to be installed and configured.
    // For info on tool: https://www.firebase.com/docs/hosting/command-line-tool.html
    firebase: {
      env: {
        development: 'hoverboard', // subdomain
        staging:     'hoverboard',
        production:  'hoverboard'
      }
    },
    // Google App Engine
    // GAE requires Google Cloud SDK to be installed and configured.
    // For info on SDK: https://cloud.google.com/sdk/
    gae: {
      env: {
        development: 'polymer-starter-kit-plus-dev', // project ID
        staging:     'polymer-starter-kit-plus-staging',
        production:  'polymer-starter-kit-plus'
      },
      // Promote the deployed version to receive all traffic.
      // https://cloud.google.com/sdk/gcloud/reference/preview/app/deploy
      promote: true
    },
    // Google Cloud Storage
    // GCS requires Google Cloud SDK with gsutil to be installed and configured.
    // For info on SDK: https://cloud.google.com/sdk/
    gcs: {
      acl: { // https://cloud.google.com/storage/docs/access-control
        development: 'public-read',
        staging:     'public-read',
        production:  'public-read'
      },
      env: { // https://cloud.google.com/storage/docs/reference-uris
        development: 'dev.example.com', // bucket
        staging:     'staging.example.com',
        production:  'www.example.com'
      },
      cacheTTL: {
        development: '0',
        staging:     '0',
        production:  '315360000', // 10 years
        productionNoCache: '300' // 5 min for files without revision hash
      }
    },
    // Any Linux hosting with SSH
    // Install your SSH public key ~/.ssh/id_rsa.pub onto a remote Linux
    // Example command: ssh-copy-id root@server.example.com
    ssh: {
      env: {
        development: '/path/to/remote-dir-dev', // remote dir must not exist
        staging:     '/path/to/remote-dir-staging',
        production:  '/path/to/remote-dir'
      },
      host: 'server.example.com',
      port: 22,
      user: 'root'
    }
  },
  // PageSpeed Insights
  // Please feel free to use the `nokey` option to try out PageSpeed
  // Insights as part of your build process. For more frequent use,
  // we recommend registering for your own API key. For more info:
  // https://developers.google.com/speed/docs/insights/v1/getting_started
  pageSpeed: {
    key: '', // need uncomment in task
    nokey: true,
    site: 'https://hoverboard.firebaseapp.com',
    strategy: 'mobile' // or desktop
  },
  // App theme
  theme: 'hoverboard-theme',
  // App version from git
  version: appVersion
};
