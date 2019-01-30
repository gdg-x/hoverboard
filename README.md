## Overview
Fork of the GDG/hoverboard repo for use on the RadicalxChange conference. Much credit due to the GDG folks for creating an awesome template to build from! 

## Features
| Feature | Description |
|---|---|
| **Fast and optimized** | 91/100 PWA on [Lighthouse](https://www.webpagetest.org/lighthouse.php?test=180111_1P_027a041bc5102982f074014807320a86&run=3) |
| **Works offline** | shitty WiFi on the venue is not a problem anymore |
| **Mobile first** | layouts optimized for small screens, Hoverboard can be installed as a native app on your phone |
| **Push notifications** | remind about sessions in My schedule, session feedback or target users with a custom message |
| **SEO optimized** | index all content and get to the top in search results |
| **Speakers and schedule management** | keep and update all information in the  Firebase |
| **My schedule** | let attendees save sessions they want to visit |
| **Customizable theme** | change colors to match your style |
| **Blog** | post announcements, updates and useful information |

## Getting Started
1. Clone repo locally
1. Setup Environment
   * Install [Node.js (v8.9.4 or above)](https://nodejs.org/en/download/)
   * Install Firebase CLI: `npm i -g firebase-tools` or `yarn global add firebase-tools`
1. Install project dependencies: 
    1. `npm install` or `yarn` from project root
    1. From inside the **functions** folder, run: 
	    `npm install firebase-functions@latest firebase-admin@latest --save`
	    `npm install -g firebase-tools`
1. Login into [Firebase CLI](https://firebase.google.com/docs/cli/): `firebase login`
1. Run locally
   * `npm run serve` or `yarn serve`
1. Build and deploy to our devo site
   * `npm run build` or `yarn build`
   * `firebase deploy`
   
*NOTE:* By default command using configurations from `/configs/development.json`.
To serve locally or deploy the production app use `yarn serve:prod` and `firebase deploy -P <prod project name here>` respectively.

:book: Read the [Full Setup Guide](/docs/).

### Docker-based development environment

If you don't want to bother with the dependencies, you can use the docker container for development. NOTE: nobody on the RadicalxChange team has tried this yet, but it looks excellent. 

:book: Read more in [docker docs](/docs/tutorials/docker.md).

## Updating
Here is a git workflow for updating your fork (or downloaded copy) to the latest version:
```console
git remote add upstream https://github.com/gdg-x/hoverboard.git
git fetch upstream
git merge upstream/hoverboard
# resolve the merge conflicts in your editor
git add . -u
git commit -m 'Updated to the latest version'
```

## Documentation

The [Getting Started guide](#getting-started) is probably a good first point of call! <br>
:book: [Full documentation](/docs/).

## Compatibility

:white_check_mark: Compatible with **latest two** version of Chrome, Chrome for Android, Firefox, Opera, Safari, Edge.<br>
:x: IE and Opera Mini aren't supported.

## Technology Stack

* Polymer 2
* Redux
* Firebase
* Service Worker
* CSS Grid

### Submitting a Pull Request

* Squash commits
* Lint your code with eslint (config provided)
* Include relevant test updates/additions

## Code of Conduct

Read the full version [Code of Conduct](/CODE_OF_CONDUCT.md).

## Contributors

This project exists thanks to all the [people who contribute](https://github.com/RadicalxChange/hoverboard/graphs/contributors). [[Contribute](CONTRIBUTING.md)].

## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fgdg-x%2Fhoverboard.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fgdg-x%2Fhoverboard?ref=badge_large)

Project is published under the [MIT license](/LICENSE.md).  
Feel free to clone and modify repo as you want, but don't forget to add reference to authors :)

_GDG[x] are not endorsed and/or supported by Google, the corporation._
