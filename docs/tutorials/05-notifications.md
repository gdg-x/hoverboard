## Notifications

There are two types of [push notifications](https://firebase.google.com/products/cloud-messaging) supported.

Browsers that support [`Navigator.permissions`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/permissions) and are supported by [Firebase Messaging](https://firebase.google.com/docs/web/environments-js-sdk).

Notifications need the `notifications` feature, and My Schedule reminders also need `mySchedule` ([Features](01-configure-app.md#features)). Both are on by default.

### My Schedule notifications

A few minutes before a sessions starts, attendees can get reminder notifications. These are sent automatically by [`schedule-notifications.ts`](../../packages/server/functions/src/triggers/schedule-notifications.ts). When the session has a stream link, the reminder has a **Watch live** button that opens it, where the browser shows notification buttons (verify on iOS). See [Content model](firebase-utils.md#content-model) for stream links. After changing `event.attendance`, `event.stream` or the tracks' `stream`, deploy the functions again.

Session times are read in the event time zone, `event.timezone` in `site.json`. The functions copy it at build time, so deploy the functions again after changing it. The optional `icon` in the Firestore `config/notifications` document sets the notification icon.

To get a notification an attendee has to:

1. Be authenticated
1. Have enabled "My Schedule notifications"
1. Have saved the session that is about to start

### General notifications

General notifications are sent to everyone (authenticated and anonymous) who has enabled "General notifications". These are sent manually by conference organizers.

To send a "General notification" from the command line:

    FIRESTORE_TARGET=production ./hb notify --title "Doors open" --body "Registration is in the main hall." --path /schedule

`--path` is the page the notification opens, or a full `https://` link. `--icon` replaces the icon from `config/notifications`. It asks before sending from production, and `--yes` sends without asking. Without `FIRESTORE_TARGET=production`, it adds the notification to the emulator, where `npm start` runs the function. It needs the `notifications` and `functions` features, since the `sendGeneralNotification` function sends it.

To send one from the Firebase console instead:

1. Got to the [project's Firestore page](https://console.firebase.google.com/u/0/project/_/firestore/data/)
1. "Start collection" with the ID `notifications`
1. On the document creation page enter the following three fields
   - `title`: `Announcing GDG DevFest Ukraine 2017`
   - `body`: `It is official. GDG DevFest Ukraine 2017 is going to take place in Lviv, on October 13-14.`
   - `path`: `/blog/dfua17-announced`
1. Save
