# Hoverboard

![Hoverboard logo](https://user-images.githubusercontent.com/2954281/42683571-55ba6be6-8696-11e8-8ff7-e9acd0db63e8.png)
[⚡ Live demo](https://hoverboard-master.web.app) | [🚀 Get Started](#getting-started)

[![Build status](https://github.com/gdg-x/hoverboard/actions/workflows/main.yaml/badge.svg)](https://github.com/gdg-x/hoverboard/actions/workflows/main.yaml)

## Overview

Project Hoverboard is the conference website template that helps you to set up a mobile-first conference website with blog, speaker and schedule management in a few minutes.

The template is created based on 7 years of [GDG Lviv](https://www.meetup.com/GDG-Lviv/) team experience of running conferences and feedback from more than 500 event organizers from all around the world who were using previous Hoverboard versions.

Our goal is to allow event organizers to set up a professional conference website with minimum resources. To get started you need only basic knowledge of web technologies and a free Firebase account.

## Features

| Feature                              | Description                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| **Fast and optimized**               | Static HTML rendered at build time, hydrated in the browser with live Firestore updates |
| **Works offline**                    | Service worker caches the schedule, My Schedule and the attending page for venue Wi-Fi  |
| **Mobile-first**                     | Layouts optimized for small screens; installable as an app on phones                    |
| **Push notifications**               | Remind attendees about saved sessions or send general announcements                     |
| **SEO optimized**                    | Pre-rendered pages, structured data and generated social preview images                 |
| **Speakers and schedule management** | Keep and update speakers, sessions and tracks in Firestore                              |
| **My schedule**                      | Let attendees save sessions they want to visit and download a calendar file             |
| **Reactions**                        | Let attendees react to sessions with applause, love and more                            |
| **Attending page**                   | Directions, doors, accessibility, hotels and Wi-Fi in one page that works offline       |
| **Customizable theme**               | Five built-in themes in light and dark, with your own colors and fonts                  |
| **Blog**                             | Post announcements, updates and useful information                                      |

## Getting Started

```console
npm ci
./hb init
npm start
```

Read the [Get started tutorial](docs/get-started.md) to set up, customize and deploy your site.

## Updating

See [Upgrade](docs/guides/upgrade.md) to update your site to the latest Hoverboard release with `./hb upgrade`.

## Documentation

Browse the [full documentation](docs/README.md):

- [Who are you?](docs/README.md#who-are-you) — paths for first-time organizers, returning organizers, content editors, fork maintainers and contributors
- [Get started](docs/README.md#get-started) and [Set up your site](docs/README.md#set-up-your-site)
- [Your event](docs/README.md#your-event), [Look and feel](docs/README.md#look-and-feel) and [Attendee features](docs/README.md#attendee-features)
- [Run your event](docs/README.md#run-your-event) and [Keep it running](docs/README.md#keep-it-running)
- [Reference](docs/README.md#reference), [How it works](docs/README.md#how-it-works) and [Contributing](docs/README.md#contributing)

## Compatibility

✅ Compatible with **latest two** major versions of browsers that support [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules).

## Technology Stack

Astro, Lit, Redux Toolkit, Firebase and Workbox. See [How it works](docs/how-it-works.md).

## Contributing

Contributions of all kinds are welcome! Read the [contributing guide](.github/CONTRIBUTING.md) and check the [open issues](https://github.com/gdg-x/hoverboard/issues).

## Code of Conduct

Read the full version [Code of Conduct](.github/CODE_OF_CONDUCT.md).

## Contributors

**Maintainer:** [Abraham Williams](https://github.com/abraham)

**Authors:** [Oleh Zasadnyy](https://github.com/ozasadnyy) and [Sophie Huts](https://github.com/sophieH29).

This project exists thanks to all the [people who contribute](https://github.com/gdg-x/hoverboard/graphs/contributors). [[Contribute](.github/CONTRIBUTING.md)].

[![List of contributors](https://opencollective.com/hoverboard/contributors.svg?width=890)](https://github.com/gdg-x/hoverboard/graphs/contributors)

## License

The project is published under the [MIT license](LICENSE.md).
Feel free to clone and modify repo as you want, but don't forget to add a reference to authors :)

_GDG[x] is not endorsed and/or supported by Google, the corporation._
