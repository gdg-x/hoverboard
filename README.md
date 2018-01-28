<p align="center">
<img width="720px" src="https://user-images.githubusercontent.com/2954281/35304027-be342c32-009c-11e8-9be9-bb5be8b26d1d.png">
</p>
<p align="center">
<a href="https://hoverboard-v2-dev.firebaseapp.com" align="center">:zap: Live demo</a>&nbsp;&nbsp;|&nbsp;&nbsp;
<a href="#getting-started">:rocket: Get Started</a>
</p>

[![Build Status](https://travis-ci.org/gdg-x/hoverboard.svg?branch=master)](https://travis-ci.org/gdg-x/hoverboard) [![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fgdg-x%2Fhoverboard.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fgdg-x%2Fhoverboard?ref=badge_shield)

## Overview
Project Hoverboard is the conference website template that helps you to set up mobile first conference website with blog, speakers and schedule management in a few minutes.

The template is created based on 7 years of [GDG Lviv](https://www.meetup.com/GDG-Lviv/) team experience of running conferences and feedback from more than 500 event organizers from all around the world who were using previous Hoverboard versions.

Our goal is to allow event organizers to set up professional conference website with minimum resources. To get started you need only basic knowledge of web technologies and a free Firebase account.

## Features
| Feature | Description |
|---|---|
| **Fast and optimized** | 91/100 PWA on [Lighthouse](https://www.webpagetest.org/lighthouse.php?test=180111_1P_027a041bc5102982f074014807320a86&run=3) |
| **Works offline** | shitty WiFi on the venue is not a problem anymore |
| **Mobile first** | layouts optimized for small screens, on Android Hoverboard can be installed as a native app |
| **Push notifications** | remind about sessions in My schedule, session feedback or target users with a custom message |
| **SEO optimized** | index all content and get to the top in search results |
| **Speakers and schedule management** | keep and update all information in the  Firebase |
| **My schedule** | let attendees save sessions they want to visit |
| **Session ratings** | collect feedback to understand speaker performance |
| **Customizable theme** | change colors to match your style |
| **Blog** | post announcements, updates and useful information |

## Getting Started
1. [Fork repository](https://github.com/gdg-x/hoverboard/fork) and clone it locally
2. Setup Environment
   * Install [Node.js (v8.9.4 or above)](https://nodejs.org/en/download/)
   * Instal Firebase CLI: `npm i -g firebase-cli`
3. Create [Firebase account](https://console.firebase.google.com) and login into [Firebase CLI](https://firebase.google.com/docs/cli/): `firebase login`
4. Update [Hoverboard config](/config) and [Resources](/data)
5. Run locally
   * `cd` into the base directory
   * `npm install` or `yarn`
   * `npm run serve` or `yarn serve`
6. Deploy
   * `npm run deploy` or `yarn deploy`

Read the [Full Setup Guide](/docs/).

## Updating
Here is a git workflow for updating your fork (or downloaded copy) to the latest version:
```
git remote add upstream https://github.com/gdg-x/hoverboard.git
git fetch upstream
git merge upstream/hoverboard-v2
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
* Firebase
* Service Worker
* CSS Grid

## Contributing

Awesome! Contributions of all kinds are greatly appreciated. To help smoothen the process we have a few non-exhaustive guidelines to follow which should get you going in no time.

### Using GitHub Issues

* Feel free to use GitHub issues for questions, bug reports, and feature requests
* Use the search feature to check for an existing issue
* Include as much information as possible and provide any relevant resources (Eg. screenshots)
* For bug reports ensure you have a reproducible test case
   * A pull request with a breaking test would be super preferable here but isn't required

### Submitting a Pull Request

* Squash commits
* Lint your code with eslint (config provided)
* Include relevant test updates/additions

## Code of Conduct

Read the full version [Code of Conduct](/docs/tutorials/Code-of-Conduct.md).

## Contributors
__Maintainer:__ [Oleh Zasadnyy](https://github.com/ozasadnyy) and [Sophie Huts](https://github.com/sophieH29).

This project exists thanks to all the [people who contribute](https://github.com/gdg-x/hoverboard/graphs/contributors). [[Contribute](CONTRIBUTING.md)].

<a href="graphs/contributors"><img src="https://opencollective.com/hoverboard/contributors.svg?width=890" /></a>

## Sponsoring
Most of the core team members, hoverboard contributors and contributors in the ecosystem do this open source work in their free time. If you like this project and it makes your life easier, please donate.  
<a href="https://opencollective.com/hoverboard#backers" target="_blank"><img src="https://opencollective.com/hoverboard/backers.svg?width=890"></a>

## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fgdg-x%2Fhoverboard.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fgdg-x%2Fhoverboard?ref=badge_large)

Project is published under the [MIT license](/LICENSE.md).  
Feel free to clone and modify repo as you want, but don't forget to add reference to authors :)

_GDG[x] are not endorsed and/or supported by Google, the corporation._
