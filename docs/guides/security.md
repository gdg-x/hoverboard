# Security

What Hoverboard protects for you, what you set in your Firebase project and GitHub repository, and how to allow external widgets in the Content Security Policy.

**For:** [fork maintainers](../README.md#fork-maintainer) and [first-time organizers](../README.md#first-time-organizer).

## What Hoverboard does

- **Firestore rules.** Visitors can only read your content. You change it in the Firebase console or with `./hb data`. Signed-in visitors can write only their own saved sessions, notification settings, feedback, reactions and public profile. A reaction needs its author's profile and a session that exists, and the rules check every field. The subscribe and partner forms can only add documents, with checked fields and sizes, and nobody can read them from the site. Export them with [`./hb data export --csv`](manage-data.md#export-collections-as-csv).
- **Storage rules.** The site can't read or write your Storage bucket.
- **Content.** Links in your config and content can only be `https:`, `http:`, `mailto:` or a path on your site. The site drops other links, such as `javascript:` ones, even when they come straight from the Firebase console. Markdown is sanitized before it is shown, and the build sanitizes the hero illustration.
- **Headers.** `firebase.json` sends `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy` and other headers on every page, and every page has a [Content Security Policy](#allow-a-widget-or-embed).
- **Sign-out.** Signing out deletes the copy of the visitor's data that the site keeps in the browser for offline use.
- **Public profiles.** With `reactions` on, the name and photo a visitor picks show to anyone, with their reactions. Nobody has a profile until they react and confirm it. The photo can only be the one from their sign-in account, so a profile can't point other visitors' browsers at any other address. Visitors delete their profile and reactions themselves. To delete someone's data on request, delete their `profiles/{userId}` document and their documents in `sessions/*/reactions` in the Firebase console.
- **Logs.** The functions don't log emails, push tokens or user IDs.
- **Deploys.** GitHub Actions deploy without a service account key, with only the roles a deploy needs. See [Deploy](deploy.md#deploying-to-firebase-with-github-actions).

The functions run as the project's default compute service account, which has the Editor role. Only code you deploy runs as it.

## What you set

Do these once when you set up a site, and check them again before the event.

1. **Run `./hb doctor`.** It checks most of the settings below; see [`hb doctor` in the CLI reference](../reference/cli.md#hb-doctor).
1. **API keys.** Restrict the Firebase web app's browser key to your site's domain and `<project>.firebaseapp.com`, and only to the APIs on [Firebase's list](https://firebase.google.com/docs/projects/api-keys#faq-required-apis-for-restricted-firebase-api-key) for Authentication, Cloud Firestore, Cloud Messaging and Performance Monitoring. Use a separate key for Google Maps, restricted to your domain and the Maps JavaScript API. `./hb doctor` checks both keys and links to them in the Google Cloud console (the check needs the API Keys API).
1. **Authorized domains.** In the Firebase console under **Authentication** > **Settings** > **Authorized domains**, keep only your site's domains. Remove `localhost`: local development uses the emulators, not your project. Preview deploys add their own domain. Remove the domains of previews that no longer exist.
1. **Email enumeration protection.** Turn it on under **Authentication** > **Settings** > **User actions**, so sign-in doesn't tell anyone which emails have accounts. New projects have it on (verify).
1. **Budgets.** Set a spend cap and a budget alert, so abuse can't run up a large bill. See [Firebase project](firebase-project.md#spend-cap-and-budget).
1. **Service account keys.** You don't need any. `./hb doctor` warns about service account keys, which never expire, and about the `github-action-*` accounts that `firebase init hosting:github` created before `./hb setup-github`. Delete those keys, the GitHub secrets that held them (such as `FIREBASE_SERVICE_ACCOUNT_*`), and the old accounts.
1. **Repository access.** Preview and live deploys use the same service account, and a pull request's workflow runs the code on its branch. Anyone who can push a branch to your repository can deploy to your live site, deploy functions and rules, and read your Firestore data, including subscribers. Only give write access to people you would trust with the Firebase console. (A separate account for previews would still need Hosting Admin, which can release to the live site too, and read access to Firestore.)
1. **Repository settings.** On GitHub, under **Settings**:
   - **Advanced Security**: turn on Dependabot alerts, secret scanning, push protection and private vulnerability reporting.
   - **Actions** > **General**: set the workflow permissions to read, and turn off "Allow GitHub Actions to create and approve pull requests" unless you use release-please or `upgrade.yaml`.
   - **Rules**: add a ruleset for `main` that requires a pull request and the `build`, `test` and `lint` checks, and blocks force pushes.

## Allow a widget or embed

Every page has a [Content Security Policy](https://developer.mozilla.org/docs/Web/HTTP/Guides/CSP) (CSP). It tells the browser where the page may load scripts, styles, frames and other files from, so a script that got into the page can't run. The build writes it from `site.json`: the Firebase project, the Google Maps key and the `theme.fonts` stylesheets. Images can come from any `https:` address.

If you add a widget or an embed from another site, add its addresses to `security.csp` in `packages/config/site.json`, by directive:

```json
"security": {
  "csp": {
    "script-src": ["https://widget.example.com"],
    "frame-src": ["https://widget.example.com"]
  }
}
```

The directives are `script-src`, `style-src`, `connect-src`, `img-src`, `font-src`, `frame-src`, `media-src` and `worker-src`. The browser console names what the policy blocked, and the directive to add it to. `npm start` runs without the policy, so check with `npm run serve` or a preview site.

## Archived editions

An [archived edition](next-edition.md) keeps its sessions, speakers, feedback and reactions in its own project, with read-only Firestore rules: only its content and the reactions can be read, and nothing can be written. Its Auth users, profiles, push tokens and saved sessions are deleted. Its `subscribers`, `potentialPartners` and feedback stay there until you delete them. `./hb edition switch` backs up the project first to `.firebase/backups`; see [Backups](backups.md) for what local backups hold.

## Reporting a vulnerability

To report a vulnerability in Hoverboard, see the [security policy](../../.github/SECURITY.md).

## See also

- [Deploy](deploy.md)
- [Firebase project](firebase-project.md)
- [Backups](backups.md)
- [CLI reference](../reference/cli.md#hb-doctor)
