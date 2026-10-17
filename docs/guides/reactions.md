# Reactions

Let signed-in attendees react to sessions with Applause, Love, Insightful, Mind blown and Funny, and manage public profiles and moderation.

**For:** [first-time organizers](../README.md#first-time-organizer), [returning organizers](../README.md#returning-organizer) and [fork maintainers](../README.md#fork-maintainer). Serves attendees at the venue and online attendees reacting to talks they watched.

## Before you start

`reactions` is on by default in `features` in `packages/config/site.json`. Reactions show only on session pages, so they need `schedule` to show anywhere, and they need at least one sign-in method in `auth.providers` ([Sign-in](sign-in.md)). They don't need `functions`.

## How reactions work

`reactions` adds a row of reactions to each session page: Applause, Love, Insightful, Mind blown and Funny. Signed-in visitors add any of them, each once. Everyone sees the counts, and each count's label names the latest people who reacted.

Visitors can react before a session and until a week after it ends, in `event.timezone`. After that, they can only take their reactions away.

## Public profiles and moderation

The first time visitors react, they pick the name to show, and the photo from their sign-in account if it has one. That is their public profile, in the `profiles` collection, and anyone can read it.

Visitors change or delete their profile under **Public profile** in the account menu. Deleting it deletes their reactions too.

Reactions are stored in `sessions/{sessionId}/reactions/{userId}`. To remove an abusive name or reaction, delete the document in the `profiles` collection or in `sessions/{sessionId}/reactions` in the Firebase console.

## Firestore reads

A session page reads every reaction to its session, and the profiles of up to 10 people it names, each time it opens. A session with 200 reactions costs about 210 Firestore reads per view (verify).

## See also

- [Sign-in](sign-in.md)
- [Security](security.md)
- [Features reference](../reference/features.md)
