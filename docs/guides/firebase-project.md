# Firebase project

Connect an existing Firebase project, choose between the Blaze and Spark plans, and set up a spend cap and budget alerts.

**For:** [first-time organizers](../README.md#first-time-organizer) and [fork maintainers](../README.md#fork-maintainer).

## Use an existing project

`./hb init` creates or selects your Firebase project, adds a web app, creates the Firestore database and writes `firebase.projectId` to `packages/config/site.json` (see [Get started](../get-started.md#set-up-your-site-with-hb-init)). If you prefer to set up the Firebase project by hand:

1. Open the [Firebase console](https://console.firebase.google.com/) and create a project, or select an existing Google Cloud project.
1. On the project overview page, add a web app (**Add Firebase to your web app**).
1. Under **Build** > **Firestore Database**, select **Create database**, pick a location near your visitors, choose **Start in production mode** (locked mode), and enable it.
1. Set your project ID as `firebase.projectId` in `packages/config/site.json`:

```json
"firebase": { "projectId": "my-devfest" }
```

Only deploys and `./hb` commands with `--production` use `firebase.projectId`. Run `./hb setup` to log in to Firebase, write `.firebaserc` for plain `npx firebase` commands, and run `./hb doctor`.

## Billing

Hoverboard's Cloud Functions send push notifications, and require the [Blaze (pay as you go) plan](https://firebase.google.com/pricing). Upgrade in the Firebase console under **Usage and billing**. Run `./hb doctor` to check the plan of the selected project. Local development with the emulators works without Blaze.

Blaze includes no-cost usage for each product, and typical conference traffic should stay within or close to it, so most sites pay little or nothing. Deploying functions also uses Cloud Build and stores images in Artifact Registry. Run `npx firebase functions:artifacts:setpolicy` once so old images are cleaned up automatically.

### Run on the free Spark plan

A site that doesn't need push notifications can turn off `functions` and `notifications` in `features` in `packages/config/site.json` and stay on the free Spark plan:

```json
"features": {
  "functions": false,
  "notifications": false
}
```

With `functions` off, `./hb deploy` and the deploy workflow skip Cloud Functions. Deploys don't delete functions that were deployed earlier: `./hb doctor` lists them, with the commands that delete them. See [Features reference](../reference/features.md).

### Spend cap and budget

Set up both in the Google Cloud console under [Billing > Budgets & alerts](https://console.cloud.google.com/billing/budgets):

1. A [spend cap budget](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps) for **Cloud Run**. Hoverboard's functions are 2nd gen, which run as Cloud Run services and are billed at [Cloud Run pricing](https://cloud.google.com/run/pricing). Choose **Spend cap enforcement**, select your project and the **Cloud Run** service, and set a monthly amount.
1. An [alerts-only budget](https://docs.cloud.google.com/billing/docs/how-to/budgets) for the whole project. Firestore, Hosting, Storage, Cloud Scheduler, Cloud Build and Artifact Registry can't be capped, so this budget only sends email.

When the spend cap is reached:

- The site keeps loading, because Hosting and Firestore aren't capped.
- Functions stop until the next month, or until you lift the cap. Notifications aren't sent.
- The cap isn't enforced instantly, and usage over it is still billed. Set it a little below the most you're willing to pay.

## See also

- [Get started](../get-started.md)
- [Sign-in](sign-in.md)
- [Deploy](deploy.md)
- [Security](security.md)
