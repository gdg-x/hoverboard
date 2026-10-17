# Sign-in

Choose how visitors sign in with `auth.providers` in `packages/config/site.json`, and turn on each method in the Firebase console.

**For:** [first-time organizers](../README.md#first-time-organizer) and [fork maintainers](../README.md#fork-maintainer). Serves attendees who sign in to save sessions to My Schedule, rate sessions and react to them.

## Choose sign-in providers

`auth.providers` in `packages/config/site.json` lists the ways visitors sign in, in the order the sign-in dialog shows them:

- `emailLink` (the default): visitors enter their email address and get a link that signs them in, with no password. It is the only one on by default.
- `google`, `facebook` and `twitter`: sign in with that account in a popup.

For example, `["emailLink", "google"]` adds Google, and `["google"]` turns email links off:

```json
"auth": {
  "providers": ["emailLink", "google"]
}
```

When `mySchedule` or `feedback` is on in `features`, `auth.providers` can't be empty. With an empty list, turn `reactions` off too, since nobody could react. The account button in the header shows when `mySchedule`, `feedback` or `reactions` is on.

## Turn on sign-in in the Firebase console

Turn on each sign-in method in `auth.providers` in the [Firebase console](https://console.firebase.google.com/) under **Authentication** > **Sign-in method**:

- `emailLink`: add **Email/Password**, and turn on **Email link (passwordless sign-in)**. The password option can stay off.
- `google`: add **Google**.
- `facebook` and `twitter`: add them with the app ID and secret from Facebook or X.

The link in the email opens the page the visitor signed in from. Its domain must be listed under **Authentication** > **Settings** > **Authorized domains**. Firebase adds `localhost` and the project's `web.app` and `firebaseapp.com` domains. Add your custom domain yourself, and remove `localhost` on production. See [Security](security.md#what-you-set).

Locally, the Auth emulator doesn't send email. Find the sign-in link under **Authentication** in the Emulator UI at http://localhost:4000, or in the emulator's log, and open it in the browser.

## See also

- [Reactions](reactions.md)
- [Security](security.md)
- [Features reference](../reference/features.md)
