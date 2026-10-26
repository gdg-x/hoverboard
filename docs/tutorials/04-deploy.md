# Deploy to Firebase

Your Firebase project must be on the Blaze plan. See [Billing](02-firebase.md#billing).

1. Create [Firebase account](https://console.firebase.google.com) and login into [Firebase CLI](https://firebase.google.com/docs/cli/):

   ```console
     npx firebase login
   ```

1. Set the Firebase project to deploy to as `firebase.projectId` in `packages/config/site.json`

   ```json
     "firebase": { "projectId": "my-devfest" }
   ```

1. Build and deploy with `packages/config/site.json`

   ```console
     ./hb deploy
   ```

   `./hb deploy` checks your Node.js version and Firebase project first, prints which project it's about to deploy to, and asks for confirmation before building and deploying. Run `./hb deploy --yes` to skip the confirmation prompt, e.g. in a scripted context.

   The build renders every page from the content in your production Firestore. It reads it with your Firebase CLI login (`npx firebase login`). After you change content in Firestore, deploy again to update the pages. Visitors' browsers still load the latest content after the page loads.

   Before the build, `./hb deploy` checks the content, the same way as `./hb data check --production`. It stops on a problem, such as a field missing from a document edited in the Firebase console, and links to the document, so you can fix it before waiting for a build. Warnings don't stop it.

   When a deploy finds functions that are no longer in the code, such as the schedule generator's `sessionsWrite`, `scheduleWrite` and `speakersWrite` after upgrading to v4, Firebase asks before deleting them. Answer yes.

   `./hb doctor` checks that every function is deployed as 2nd gen. A deploy can't upgrade a 1st gen function, so it names the command that deletes one first.

   The URL to your live site is listed in the output.

## Continuous integration with Github Actions

In the [`.github/workflows`](.github/workflows) folder, you can find two workflows to help you develop and deploy Hoverboard to Firebase:

- [`main.yaml`](.github/workflows/main.yaml) Builds the project, runs the linter and the tests on every push.
- [`security.yaml`](.github/workflows/security.yaml) Checks the workflows with zizmor, and the dependencies for known vulnerabilities.
- [`deploy-preview.yaml`](.github/workflows/deploy-preview.yaml) Checks `packages/config` with `./hb config validate`, then deploys a preview of the website to Firebase after every push to a pull request. Functions and Firestore rules are not deployed. See [Editing on GitHub](01-configure-app.md#editing-on-github).
- [`deploy.yaml`](.github/workflows/deploy.yaml) Deploys the project to Firebase after every push to the `main` branch. You can also run it by hand, for example after you change content in Firestore: open **Actions** > **Deploy** > **Run workflow** on GitHub, or run `gh workflow run deploy.yaml`. It only deploys from `main`. It deploys with `--force`, so it deletes functions that are no longer in the code without asking.
- [`upgrade.yaml`](.github/workflows/upgrade.yaml) Every Monday, runs `./hb upgrade` and opens a pull request for the new Hoverboard release, if there is one. See [Upgrading](../releases.md#upgrading).

The `main.yaml` workflow is already configured and will work out of the box, once you fork the hoverboard repo.
To run the two `deploy` actions on your instance, you need to do a couple of small setup:

### Deploying to Firebase with Github Actions

Both workflows deploy to `firebase.projectId` from `packages/config/site.json`, which `./hb config project-id` prints. You don't need to edit them. Without `packages/config/site.json`, they stop instead of deploying the demo site. Hoverboard's own repository, whose site is the demo, sets the `HB_DEMO` repository variable to `true`.

Both workflows sign in to Google Cloud with Workload Identity Federation, through the [firebase-wif](https://github.com/abraham/firebase-wif) Action. GitHub gives each run a short-lived token, so there is no service account key to store or rotate. Only workflows in your repository can use it. Set it up once:

```console
  ./hb setup-github --dry-run
  ./hb setup-github
```

The command sets it up with [firebase-wif](https://github.com/abraham/firebase-wif), using your Firebase CLI login and your [GitHub CLI](https://cli.github.com/) login (or `GH_TOKEN`). It needs the Owner role, or permission to create service accounts, workload identity pools and IAM bindings, and admin access to the repository. It lists the changes and asks before making them. It is safe to run again. It:

1. Enables the APIs a deploy needs.
1. Creates a `github` workload identity pool and a provider that only accept tokens from your repository, by its ID. It reads the repository from the `origin` remote. Pass `--repo owner/name` to choose another one.
1. Creates a service account with the roles for what `firebase.json` deploys: `Firebase Hosting Admin`, `Firebase Rules Admin`, `Cloud Datastore Index Admin`, `Firebase Storage Viewer`, `Storage Bucket Viewer`, `Cloud Functions Admin` and `Service Usage Consumer`, and `Service Account User` on the functions' runtime accounts. Hoverboard adds `Cloud Datastore Viewer`, because the build reads your content, and `Cloud Scheduler Admin`, for the scheduled functions. It can't write to Firestore or read Auth users and Storage files.
1. Sets the `FIREBASE_WIF_PROVIDER` and `FIREBASE_WIF_SERVICE_ACCOUNT` repository variables.
1. Creates a `production` environment that only the default branch can deploy to, which `deploy.yaml` uses, and a `preview` environment that any branch can deploy to, which `deploy-preview.yaml` uses.

Without GitHub credentials, it prints the variables and environments to add in the repository settings.

Earlier versions of `./hb setup-github` set the `WIF_PROVIDER` and `DEPLOY_SERVICE_ACCOUNT` variables. Run it again after upgrading: it reuses their pool, provider and `github-deploy` account, limits the provider to the repository's ID and sets the new variables. Then delete the old variables. Earlier versions also granted `Service Account User` on the whole project. `./hb doctor` names the roles the account has beyond the ones it needs. Remove them in the Google Cloud console under **IAM** (verify that a deploy still works).

If the auth step fails because `workload_identity_provider` is empty, the repository variables are missing. Run `./hb setup-github`.

`./hb doctor` checks the Google Cloud and GitHub setup and the deploy workflows. It warns about anything `./hb setup-github` would still change. It also warns about service account keys, which never expire, and about the `github-action-*` accounts that `firebase init hosting:github` created for deploys before `./hb setup-github`. Delete those keys, the GitHub secrets that held them (such as `FIREBASE_SERVICE_ACCOUNT_*`), and the old accounts.

`./hb doctor` also checks the browser API key of the Firebase web app, and the Maps key in `site.json` when the map is on. Each key should only work from the site's domain and `<project>.firebaseapp.com`, and only call the APIs the site uses with it. The browser key needs the Firebase APIs on [Firebase's list](https://firebase.google.com/docs/projects/api-keys#faq-required-apis-for-restricted-firebase-api-key) for Authentication, Cloud Firestore, Cloud Messaging and Performance Monitoring, and the Maps key needs the Maps JavaScript API. Doctor names any other API a key can call, and links to the key in the Google Cloud console. The check needs the API Keys API, and links to the page that turns it on.

Missing roles show up as `403` errors such as `Permission denied to get service` (Service Usage), a failed `firebaserules.googleapis.com` `:test` request (Rules) or `Failed to list functions` (Cloud Functions).

Pull requests from forks cannot get a token, so they do not deploy a preview. Their config is still checked.

The preview and the live deploys use the same service account. A pull request's workflow runs the code on its branch, so anyone who can push a branch to your repository can deploy to the live site, deploy functions and rules, and read your Firestore data, including subscribers. The `production` environment doesn't prevent this, since the provider accepts every workflow run of the repository. Only give write access to the repository to people you would trust with the Firebase console. A separate account for previews wouldn't help much: it would still need Hosting Admin, which can release to the live site too, and read access to Firestore.

The first deploy, from `./hb init` or `./hb deploy`, runs with your own account. It enables the APIs and grants Google's service agents the roles functions need. `./hb init` creates the Firestore database before it, in the location you pick. The deploy account can't do these, so if a new kind of function needs another API, deploy once from your computer.

You can now push to your `main` branch and it'll deploy to the production (`live`) Firebase Hosting channel and pull requests will deploy a temporary preview.

Before the event, go through the [security checklist](06-security.md#what-you-set).
