# Attending page

Fill in the `/attending` page with directions, door times, venue accessibility, hotels, Wi-Fi and floor plan images so attendees have everything in one place—including offline at the venue.

**For:** [first-time organizers](../README.md#first-time-organizer), [returning organizers](../README.md#returning-organizer) and [content editors](../README.md#content-editor). Serves attendees at the venue and online attendees.

## Before you start

The `attending` feature is on by default in `packages/config/site.json`. With it off, the `/attending` page is left out and the home page doesn't link to it.

## What the page fills on its own

The `/attending` page is one place to link to from your welcome email or ticket confirmation. The default `navigation` links to it, and so do the place in the home page hero and the venue block.

It fills two sections from `packages/config/site.json` automatically:

- **Where it is:** the venue, its address, `mapBlock.description`, directions, and the map when `integrations.googleMapsApiKey` is set, as on the home page.
- **Joining online:** for an online or hybrid event, the link in `event.stream` and the time zone the site's times are in.

## Sections in `resources.json`

Write the sections that only you know in `attendingPage` in `packages/config/content/resources.json`. Every field is optional, and a section without content is left out of the page and its table of contents. Text fields are short [Markdown](https://commonmark.org/help/), so they can have links and `code`.

```json
"attendingPage": {
  "description": "How to get to DevFest Ukraine, when the doors open, and what to expect at the venue.",
  "photo": { "image": "/images/venue.jpg", "alt": "The glass front of the venue" },
  "floorPlan": {
    "image": "/images/floor-plan.png",
    "alt": "The ground floor: registration at the entrance, the main hall to the left"
  },
  "online": "Ask questions in the chat under the stream. Speakers answer them at the end.",
  "gettingThere": [
    { "mode": "train", "text": "The station is 15 minutes away by tram 6." },
    { "mode": "parking", "text": "Paid parking under the venue." },
    { "mode": "other", "title": "By rocket", "text": "Land on the roof." }
  ],
  "doors": [
    { "day": "2027-10-15", "open": "08:00", "close": "20:00", "note": "Registration at the main entrance." },
    { "day": "2027-10-16", "open": "08:30", "close": "19:00" }
  ],
  "accessibility": "Every room is step-free. Tell us what you need when you register.",
  "accommodation": {
    "text": "We have a discount at a hotel across the street.",
    "hotels": [
      {
        "name": "Hotel Example",
        "address": "3 Example Street",
        "note": "Rooms from 90€ a night.",
        "code": "DEVFEST",
        "url": "https://hotel.example/book"
      }
    ]
  },
  "atVenue": [
    { "topic": "wifi", "text": "Network `DevFest`, password `devfest2027`." },
    { "topic": "food", "text": "Lunch and coffee are included." }
  ]
}
```

- `description` is the page's description for search engines and link previews. The text under the page title is `heroDescriptions.attending`.
- `photo` shows next to the venue's address, and `floorPlan` in its own section, with a button that opens it full size. Each needs `alt`, which describes the image for people who can't see it. Put the images in `packages/config/public/images`.
- `online` shows under the link to the stream, for an online or hybrid event.
- `gettingThere` lists the ways to get to the venue, in your order. `mode` picks the icon and the heading: `train` (By train), `plane`, `bus`, `tram`, `metro`, `car`, `parking`, `bike`, `walk` (On foot) or `other`.
- `doors` lists when the doors open and close each day. `day` is a day of the event, and `open` and `close` are `HH:MM` in `event.timezone`.
- `accessibility` is about getting around the venue: step-free access, lifts, accessible toilets, seating, sign language or live captions, and who to ask for help.
- `accommodation` has your text, then each hotel. Visitors can copy `code` with a button.
- `atVenue` lists practical details. `topic` picks the icon and the heading: `wifi`, `food`, `cloakroom`, `firstAid`, `quietRoom`, `lostAndFound`, `childcare` or `other`.
- In `gettingThere` and `atVenue`, `title` replaces the heading, for example "By tram line 1". `other` needs one.

The headings are UI text, so they follow the visitor's language. For an online event, the page leaves out the floor plan, getting there, doors, accommodation and at the venue, since there is no venue.

The build fails when an image is not in `packages/config/public` or `packages/web/public`, an image has no `alt`, a door's `day` is not between `event.startDate` and `event.endDate`, or a door closes before it opens. `./hb init` removes doors outside the new dates.

## Attending page images

The attending page has two optional images, `attendingPage.photo` and `attendingPage.floorPlan`:

- **The venue photo** is cropped to a 3:2 frame, and shows up to about 800 pixels wide. A 1600×1067 JPEG or WebP is sharp on high-density screens. Keep the subject in the middle, since the edges may be cropped.
- **The floor plan** is not cropped, and shows up to 1200 pixels wide, the width of the content. Visitors can open it full size, so make it 2400 pixels wide, or an SVG. Use high-contrast labels that are still readable on a phone.

## Offline download

The service worker downloads the `/attending` page and its images when a visitor first opens the site, so attendees can open it at the venue without a connection, even if they never opened `/attending` before. Keep each image under 500 KB if you can. Images over 2 MB are left out of the offline download, and the build warns about them. A page over 2 MB is left out too, with a warning in the build output.

## See also

- [Event details](event-details.md)
- [Accessibility](accessibility.md)
- [Pages](pages.md)
