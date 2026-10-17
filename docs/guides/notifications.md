# Notifications

Send automatic session reminders before talks in My Schedule, and broadcast general push notifications to attendees with `./hb notify`.

**For:** [first-time organizers](../README.md#first-time-organizer), [returning organizers](../README.md#returning-organizer) and [content editors](../README.md#content-editor). Serves attendees at the venue and online attendees.

## Before you start

Notifications need the `notifications` and `functions` features (and the [Blaze plan](firebase-project.md#billing)), and My Schedule reminders also need `mySchedule` ([Features reference](../reference/features.md)). All are on by default.

Push notifications work in browsers that support [`Navigator.permissions`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/permissions) and [Firebase Cloud Messaging](https://firebase.google.com/docs/web/environments-js-sdk).

## My Schedule notifications

A few minutes before a session starts, attendees can get reminder notifications, sent automatically by [`schedule-notifications.ts`](../../packages/server/functions/src/triggers/schedule-notifications.ts). When the session has a stream link, the reminder has a **Watch live** button that opens it, where the browser shows notification buttons (verify on iOS). See [Schedule](schedule.md#watching-live) for how stream links are chosen.

Session times are read in `event.timezone`, and the functions read `site.json` from a build-time copy; see [How it works](../how-it-works.md#cloud-functions) for when to redeploy the functions. The optional `icon` in the Firestore `config/notifications` document sets the notification icon.

To get a reminder notification, an attendee has to:

1. Be signed in.
1. Have enabled "My Schedule notifications".
1. Have saved the session that is about to start.

## General notifications

General notifications are sent to everyone (signed-in and anonymous) who has enabled "General notifications". Send one from the command line:

```console
./hb notify --production --title "Doors open" --body "Registration is in the main hall." --path /schedule
```

`--path` is the page the notification opens, or a full `https://` link. `--icon` replaces the icon from `config/notifications`. Without `--production`, it adds the notification to the emulator, where `npm start` runs the function. See [`hb notify` in the CLI reference](../reference/cli.md#hb-notify) for all flags.

To send one from the Firebase console instead:

1. Go to the [project's Firestore page](https://console.firebase.google.com/u/0/project/_/firestore/data/).
1. Select **Start collection** with the ID `notifications`.
1. Enter the fields for the new document:
   - `title`: `Announcing GDG DevFest Ukraine 2027`
   - `body`: `GDG DevFest Ukraine 2027 takes place in Lviv on October 15-16.`
   - `path`: `/blog/dfua27-announced`
1. Save.

## See also

- [Schedule](schedule.md)
- [Run your event](run-your-event.md)
- [CLI reference](../reference/cli.md#hb-notify)
