# Schedule

Define tracks in `packages/config/site.json`, place sessions on days and tracks in Firestore, add live stream links, and publish the schedule when it is ready.

**For:** [content editors](../README.md#content-editor), [first-time organizers](../README.md#first-time-organizer) and [returning organizers](../README.md#returning-organizer). Serves prospective attendees planning their visit, attendees at the venue, and online attendees watching in their own time zone.

## Tracks

`schedule.tracks` in `packages/config/site.json` lists the tracks or rooms, in the order the schedule shows them:

```json
"schedule": {
  "published": true,
  "tracks": [
    { "id": "main", "title": "Main stage", "stream": "https://www.youtube.com/watch?v=main" },
    { "id": "workshops", "title": "Workshops", "days": ["2027-10-16"] }
  ]
}
```

- A session names its track by `id`.
- A track is on every day of the event, unless `days` lists the days it is on.
- `stream` is the optional `https:` link to watch the track's sessions live, such as one link per room.
- Without tracks, the schedule has one column.

## Sessions on the schedule

In the `sessions` collection in Firestore, a session is placed on the schedule with:

- `day`: `YYYY-MM-DD`, between `event.startDate` and `event.endDate`.
- `startTime` and `endTime`: `HH:MM` in `event.timezone`.
- `track`: a track `id` from `schedule.tracks` in `packages/config/site.json`.

A session without `track` spans every track, such as a keynote or lunch. A session without a day and times isn't on the schedule yet, but shows on its own page and its speakers' pages. Two short talks in one slot are two sessions with their own times.

## Publishing

`schedule.published` in `packages/config/site.json` controls whether session times and tracks are shown. Keep it `false` until the schedule is final.

Until `schedule.published` is `true` and sessions have a day and times, the schedule navigation entry and home page buttons stay hidden, and `/schedule` says the schedule is coming soon. Once published, the service worker downloads every day of the schedule and My Schedule for offline use when a visitor opens the site.

Schedule edits in Firestore show in visitors' browsers at once, and in the rendered HTML after the next deploy. See [How it works](../how-it-works.md#how-pages-are-built).

## Watching live

A session uses the first stream link that is set:

1. The session's own `stream` field in Firestore (`https:`).
1. Its track's `stream` in `schedule.tracks` in `packages/config/site.json`.
1. `event.stream` in `packages/config/site.json`, for an online or hybrid event.

From 10 minutes before the session starts until it ends, the session page shows **Watch live**, the schedule marks the session **Live**, and calendar links include the stream. When My Schedule reminders are on, the reminder notification includes a **Watch live** button too. After changing `event.attendance`, `event.stream` or track `stream` links in `site.json`, deploy the functions again. See [How it works](../how-it-works.md#cloud-functions).

## On now

On the event's days, the home page shows **On now** below the hero: the sessions that are on, with their links to watch live, and the sessions that start in the next 30 minutes. It hides itself between sessions when nothing is coming up. It requires the `schedule` feature, `schedule.published: true`, and sessions with a day and times.

## Schedule checks

`./hb data seed`, `./hb data import`, `./hb data check` and the build all check the schedule:

- Each session's `track` must exist in `schedule.tracks` in `site.json` and be active on the session's `day`.
- `endTime` must be after `startTime`.
- Sessions in the same track on the same day can't overlap.

The build fails and names the conflicting sessions when a check fails. Run the check yourself with:

```console
./hb data check --production
```

## See also

- [Content](content.md)
- [Event details](event-details.md)
- [Run your event](run-your-event.md)
- [Content model reference](../reference/content-model.md)
