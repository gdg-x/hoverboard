# Security

What Hoverboard protects for you, and what you set in your own Firebase project and GitHub repository.

## What Hoverboard does

- **Firestore rules.** Visitors can only read your content. You change it in the Firebase console or with `./hb firestore-*`. Signed-in visitors can write only their own saved sessions, notification settings, feedback, reactions and public profile. A reaction needs its author's profile and a session that exists, and the rules check every field. The subscribe and partner forms can only add documents, with checked fields and sizes, and nobody can read them from the site. Export them with [`./hb firestore-csv`](01-configure-app.md#subscribers-and-partner-leads).
- **Storage rules.** The site can't read or write your Storage bucket.
- **Content.** Links in your config and content can only be `https:`, `http:`, `mailto:` or a path on your site. The site drops other links, such as `javascript:` ones, even when they come straight from the Firebase console. Markdown is sanitized before it is shown, and the build sanitizes the hero illustration.
- **Headers.** `firebase.json` sends `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy` and other headers on every page, and every page has a [Content Security Policy](01-configure-app.md#content-security-policy).
- **Sign-out.** Signing out deletes the copy of the visitor's data that the site keeps in the browser for offline use.
- **Public profiles.** With `reactions` on, the name and photo a visitor picks show to anyone, with their reactions. Nobody has a profile until they react and confirm it. The photo can only be the one from their sign-in account, so a profile can't point other visitors' browsers at any other address. Visitors delete their profile and reactions themselves. To delete someone's data on request, delete their `profiles/{userId}` document and their documents in `sessions/*/reactions` in the Firebase console.
- **Logs.** The functions don't log emails, push tokens or user IDs.
- **Deploys.** GitHub Actions deploy without a service account key, with only the roles a deploy needs. See [Deploying to Firebase with Github Actions](04-deploy.md#deploying-to-firebase-with-github-actions).

The functions run as the project's default compute service account, which has the Editor role. Only code you deploy runs as it.

## What you set

Do these once when you set up a site, and check them again before the event.

1. **Run `./hb doctor`.** It checks most of the settings below.
1. **API keys.** Restrict the Firebase web app's browser key to your site's domains and to the APIs the site uses. Use a separate key for Google Maps, restricted to your domain and the Maps JavaScript API. `./hb doctor` checks both keys. See [Deploying to Firebase with Github Actions](04-deploy.md#deploying-to-firebase-with-github-actions).
1. **Authorized domains.** In the Firebase console under **Authentication** > **Settings** > **Authorized domains**, keep only your site's domains. Remove `localhost`: local development uses the emulators, not your project. Preview deploys add their own domain. Remove the domains of previews that no longer exist.
1. **Email enumeration protection.** Turn it on under **Authentication** > **Settings** > **User actions**, so sign-in doesn't tell anyone which emails have accounts. New projects have it on (verify).
1. **Budgets.** Set a spend cap and a budget alert, so abuse can't run up a large bill. See [Spend cap and budget](02-firebase.md#spend-cap-and-budget).
1. **Service account keys.** You don't need any. `./hb doctor` warns about keys and about the old `github-action-*` accounts. Delete them, and the GitHub secrets that held them.
1. **Repository access.** Anyone who can push a branch can deploy to your live site and read your Firestore data. Only give write access to people you would trust with the Firebase console.
1. **Repository settings.** On GitHub, under **Settings**:
   - **Advanced Security**: turn on Dependabot alerts, secret scanning, push protection and private vulnerability reporting.
   - **Actions** > **General**: set the workflow permissions to read, and turn off "Allow GitHub Actions to create and approve pull requests" unless you use release-please.
   - **Rules**: add a ruleset for `main` that requires a pull request and the `build`, `test` and `lint` checks, and blocks force pushes.

## What `./hb doctor` checks

- Your Node.js version, Firebase login, project and site config.
- No service account key files in the repository root.
- The Blaze plan, and that every function is deployed as 2nd gen.
- The Realtime Database is off.
- The GitHub deploy setup and its roles, as `./hb setup-github` sets them.
- Service account keys, and old `github-action-*` accounts.
- The browser API key and the Maps key: which sites and APIs they allow.
- Backups from `./hb firestore-check --fix` older than 30 days. They hold your content.

Each problem comes with what to change. Some checks need an API turned on in your project, and say so.

## Reporting a vulnerability

To report a vulnerability in Hoverboard, see the [security policy](../../.github/SECURITY.md).
