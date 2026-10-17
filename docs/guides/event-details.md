# Event details

Set your event's name, organizer, dates, time zone, attendance mode, venue and stream link in `packages/config/site.json`.

**For:** [first-time organizers](../README.md#first-time-organizer) and [returning organizers](../README.md#returning-organizer).

## Name and organizer

Edit `shortName`, `organizer` and `social` in `packages/config/site.json`:

```json
{
  "$schema": "../web/schemas/site.schema.json",
  "firebase": { "projectId": "my-devfest" },
  "shortName": "DevFest",
  "organizer": {
    "name": "GDG Lviv",
    "email": "devfest@gdg.org.ua",
    "url": "https://lviv.gdg.org.ua/",
    "blog": "https://medium.com/gdg-lviv"
  },
  "social": {
    "hashtag": "DevFest",
    "follow": [{ "name": "youtube", "url": "https://www.youtube.com/@example" }]
  }
}
```

Each speaker's and session's page ends with "Speaking here? Report a mistake", which emails `organizer.email` with the speaker's name or the session's title in the subject.

## Dates and time zone

Set `event.startDate`, `event.endDate` and `event.timezone` in `packages/config/site.json`:

```json
"event": {
  "startDate": "2027-10-15",
  "endDate": "2027-10-16",
  "timezone": "Europe/Kyiv"
}
```

`event.timezone` is the [IANA time zone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) of the event, for example `Europe/Kyiv` or `America/New_York`. Session days and times in Firestore are in this time zone. Calendar links, the feedback window and session reminders use it.

The schedule shows times in `event.timezone`, and visitors in another time zone can switch the schedule to their own. Session pages and the home page's **On now** follow the same choice, and say "(your time)". For an `online` event, times start in the visitor's time zone, and the switch turns them back to the event's. The browser remembers the choice. During the event, a line on the schedule marks the current time.

The event dates on the home page come from `event.startDate` and `event.endDate`, formatted for the visitor's language.

After changing `event.timezone`, deploy the Cloud Functions again so session reminders use the new time zone. See [How it works](../how-it-works.md#cloud-functions).

## In person, online or hybrid

`event.attendance` in `packages/config/site.json` says how people attend: `inPerson` (the default), `online` or `hybrid`. `event.stream` is the `https:` link to watch the event online.

- An `online` event needs `event.stream`, and the build fails with `features.map` on, since there is no venue to show. It needs no `event.location`, and the site ignores one that is there. The home page, social images and link previews say "Online" instead of the venue. Calendar links point to `event.stream`. Search engines get the event as online, at `event.stream`.
- A `hybrid` event shows both: "Lviv, Ukraine · Online", the venue in calendar links with the stream below the description, and both places for search engines. A `hybrid` event without `event.stream` builds with a warning.

For example, an online event in `packages/config/site.json` (`./hb init` writes this when you answer `online`):

```json
"event": {
  "attendance": "online",
  "stream": "https://www.youtube.com/@example/live",
  "startDate": "2027-11-05",
  "endDate": "2027-11-05",
  "timezone": "America/New_York"
},
"features": { "map": false }
```

See [Schedule](schedule.md#watching-live) for per-track and per-session stream links.

## Venue and map

For an in-person or hybrid event, set `event.location` and optionally `integrations.googleMapsApiKey` in `packages/config/site.json`:

```json
"event": {
  "startDate": "2027-10-15",
  "endDate": "2027-10-16",
  "timezone": "Europe/Kyiv",
  "location": {
    "name": "Planeta Kino",
    "city": "Lviv",
    "short": "Lviv, Ukraine",
    "address": "36 Shchyretska St, Lviv, Ukraine",
    "pointer": { "latitude": 49.809841, "longitude": 23.972805, "zoom": 15 },
    "mapCenter": { "latitude": 49.809841, "longitude": 23.972805 }
  }
},
"integrations": {
  "googleMapsApiKey": "AIza..."
}
```

The venue block on the home page and the attending page show `event.location` with directions in Google Maps, Apple Maps and OpenStreetMap. With `integrations.googleMapsApiKey`, they also show a map that loads only when a visitor asks for it, so other visits do not load Google Maps. Restrict the Maps API key to your site's domain and the Maps JavaScript API; see [Security](security.md#what-you-set).

## See also

- [Schedule](schedule.md)
- [Attending page](attending-page.md)
- [Pages](pages.md)
- [Configuration reference](../reference/configuration.md)
