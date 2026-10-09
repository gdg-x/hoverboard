# Configure your app with Firebase

In case to have Authentication and My Schedule features, you'll need a Firebase project and your specific configuration data that has a few details about your project.

1. Create a Firebase project in the [Firebase console](https://console.firebase.google.com/), if you don't already have one.

- If you already have an existing Google project associated with your app, click _Import Google Project_. Otherwise, click _Create New Project_.
- If you already have a Firebase project, click _Add App_ from the project overview page.

1. Click _Add Firebase to your web app_.

1. Set your Firebase project ID as `firebase.projectId` in `packages/config/site.json`. Only deploys and `FIRESTORE_TARGET=production` commands use it. Local development always uses the `demo-hoverboard` project on the emulators.
   - _Tip: `./hb setup` logs you in and writes `.firebaserc` from it, so plain `npx firebase` commands use the same project._

1. Seed data for local development
   - Local development runs against the [Firestore emulator](https://firebase.google.com/docs/emulator-suite) instead of your live project, so no Firestore database setup is required for this
   - [Optional] You can edit `docs/default-firebase-data.json` to use your own data
   - Run `npm start`, then in another terminal run `./hb firestore-init` to import that data into the running emulator

1. [Optional] Import initial data into the **production** Firebase Database
   - Enable Firestore in web console at [console.firebase.google.com](https://console.firebase.google.com) -> Database -> Cloud Firestore -> Create database. Select **locked mode** and press **Enable**
   - The command signs in with your Firebase CLI login (`npx firebase login`) and writes to the project in `site.json`. No service account key is needed.
   - [Optional] If you need to clear out all of your data first, run `npx firebase firestore:delete --recursive --all-collections`
   - Run `FIRESTORE_TARGET=production ./hb firestore-init`

1. Whoa! You've set up Firebase into your app.

_Tip: Check out [firestore utils](firebase-utils.md) docs_

## Sign-in

Turn on the sign-in methods in `auth.providers` in the [Firebase console](https://console.firebase.google.com/) under **Authentication** > **Sign-in method**:

- `emailLink`: add **Email/Password**, and turn on **Email link (passwordless sign-in)**. The password option can stay off.
- `google`: add **Google**.
- `facebook` and `twitter`: add them with the app ID and secret from Facebook or X.

The link in the email opens the page the visitor signed in from. Its domain must be under **Authentication** > **Settings** > **Authorized domains**. Firebase adds `localhost` and the project's `web.app` and `firebaseapp.com` domains. Add a custom domain yourself, and remove `localhost`. See [Security](06-security.md#what-you-set).

Locally, the Auth emulator doesn't send email. Find the sign-in link under **Authentication** in the Emulator UI at http://localhost:4000, or in the emulator's log, and open it in the browser.

## Billing

Hoverboard's Cloud Functions send notifications, and need the [Blaze (pay as you go) plan](https://firebase.google.com/pricing). Upgrade in the Firebase console under **Usage and billing**. Run `./hb doctor` to check the plan of the selected project. Local development with the emulators works without Blaze. A site without these can turn off `functions` in `features` and stay on the free Spark plan. See [Features](01-configure-app.md#features).

Blaze includes no-cost usage for each product, and typical conference traffic should stay within or close to it, so most sites pay little or nothing. Deploying functions also uses Cloud Build and stores images in Artifact Registry. Run `npx firebase functions:artifacts:setpolicy` once so old images are cleaned up automatically.

### Spend cap and budget

Set up both in the Google Cloud console under [Billing > Budgets & alerts](https://console.cloud.google.com/billing/budgets):

1. A [spend cap budget](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps) for **Cloud Run**. Hoverboard's functions are 2nd gen, which run as Cloud Run services and are billed at [Cloud Run pricing](https://cloud.google.com/run/pricing). Choose **Spend cap enforcement**, select your project and the **Cloud Run** service, and set a monthly amount.
1. An [alerts-only budget](https://docs.cloud.google.com/billing/docs/how-to/budgets) for the whole project. Firestore, Hosting, Storage, Cloud Scheduler, Cloud Build and Artifact Registry can't be capped, so this budget only sends email.

When the spend cap is reached:

- The site keeps loading, because Hosting and Firestore aren't capped.
- Functions stop until the next month, or until you lift the cap. Notifications aren't sent.
- The cap isn't enforced instantly, and usage over it is still billed. Set it a little below the most you're willing to pay.
