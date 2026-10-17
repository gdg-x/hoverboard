# Deploy

Deploy your site from your computer with `./hb deploy`, set up GitHub Actions to deploy previews and merges automatically, and configure a custom domain.

**For:** [first-time organizers](../README.md#first-time-organizer) and [fork maintainers](../README.md#fork-maintainer).

## Before you start

With `functions` on (the default), your Firebase project must be on the Blaze plan. With `functions` set to `false` in `features`, the site deploys on the free Spark plan without notifications. See [Firebase project](firebase-project.md#billing).

## Deploy from your computer

1. Sign in to the [Firebase CLI](https://firebase.google.com/docs/cli/):

```console
npx firebase login
```

1. Set the Firebase project to deploy to as `firebase.projectId` in `packages/config/site.json`:

```json
"firebase": { "projectId": "my-devfest" }
```

1. Build and deploy:

```console
./hb deploy
```

`./hb deploy` checks your Node.js version and Firebase project first, prints which project it's about to deploy to, and asks for confirmation before building and deploying. Run `./hb deploy --yes` to skip the confirmation prompt.

Before the build, `./hb deploy` checks the content in production Firestore, the same way as `./hb data check --production` (see [Manage data](manage-data.md#check-the-data)). It stops on a problem, such as a field missing from a document edited in the Firebase console, and links to the document, so you can fix it before waiting for a build. Warnings don't stop it.

The build renders every page from your production Firestore content; see [How it works](../how-it-works.md#how-pages-are-built). `./hb doctor` checks that every function is deployed as 2nd gen, and names the command to delete a 1st gen function first. The URL to your live site is listed in the output.

## Custom domain

`url` in `packages/config/site.json` defaults to `https://<firebase.projectId>.web.app/`. If you connect a custom domain in the Firebase console under **Hosting**, set `url` to your domain, ending with a slash:

```json
"url": "https://devfest.example.com/"
```

Add the custom domain to **Authentication** > **Settings** > **Authorized domains** and to your API key restrictions as well; see [Security](security.md#what-you-set).

## Continuous integration with Github Actions

In the [`.github/workflows`](../../.github/workflows) folder, five workflows help you check, deploy and upgrade Hoverboard:

- [`main.yaml`](../../.github/workflows/main.yaml): builds the project, runs the linter and runs the tests on every push.
- [`security.yaml`](../../.github/workflows/security.yaml): checks the workflows with zizmor, and the dependencies for known vulnerabilities.
- [`deploy-preview.yaml`](../../.github/workflows/deploy-preview.yaml): checks `packages/config` with `./hb config validate`, then deploys a preview of the website to Firebase after every push to a pull request. Functions and Firestore rules are not deployed. See [Edit on GitHub](edit-on-github.md).
- [`deploy.yaml`](../../.github/workflows/deploy.yaml): deploys the project to Firebase after every push to the `main` branch. You can also run it by hand, for example after you change content in Firestore: open **Actions** > **Deploy** > **Run workflow** on GitHub, or run `gh workflow run deploy.yaml`. It only deploys from `main`. It deploys with `--force`, so it deletes functions that are no longer in the code without asking.
- [`upgrade.yaml`](../../.github/workflows/upgrade.yaml): every Monday, runs `./hb upgrade` and opens a pull request for the new Hoverboard release, if there is one. See [Upgrade](upgrade.md#weekly-upgrade-workflow).

`main.yaml` and `security.yaml` work out of the box as soon as you fork the repository.

### Deploying to Firebase with Github Actions

Both deploy workflows deploy to `firebase.projectId` from `packages/config/site.json`, which `./hb config project-id` prints. You don't need to edit them. Without `packages/config/site.json`, they stop instead of deploying the demo site. Hoverboard's own repository, whose site is the demo, sets the `HB_DEMO` repository variable to `true`.

Both workflows sign in to Google Cloud with Workload Identity Federation. GitHub gives each run a short-lived token, so there is no service account key to store or rotate. Only workflows in your repository can use it. Set it up once:

```console
./hb setup-github --dry-run
./hb setup-github
```

The command uses your Firebase CLI login. It needs the Owner role, or permission to create service accounts, workload identity pools and IAM bindings. It is safe to run again. It:

1. Enables the IAM, IAM Credentials, Security Token Service and Cloud Resource Manager APIs.
1. Creates a `github-deploy` service account with the roles a deploy needs: `Firebase Hosting Admin`, `Firebase Rules Admin`, `Cloud Datastore Index Admin`, `Cloud Datastore Viewer` (the build reads your content), `Firebase Storage Viewer`, `Storage Bucket Viewer`, `Cloud Functions Admin`, `Cloud Scheduler Admin`, `Service Usage Consumer` and `Service Account User`. It can't write to Firestore or read Auth users and Storage files. Earlier versions granted `Firebase Admin`, `Cloud Run Admin`, `Artifact Registry Writer` and `Service Usage Admin`, and the command takes them away.
1. Creates a `github` workload identity pool and provider that only accept tokens from your repository. It reads the repository from the `origin` remote. Pass `--repo owner/name` to choose another one.
1. Sets the `WIF_PROVIDER` and `DEPLOY_SERVICE_ACCOUNT` repository variables with the [GitHub CLI](https://cli.github.com/). Without it, the command prints the values to add in the repository settings.

If the auth step fails with `must specify exactly one of "workload_identity_provider" or "credentials_json"`, the repository variables are missing. Run `./hb setup-github`.

`./hb doctor` checks the Google Cloud and GitHub setup, and warns about anything `./hb setup-github` would still change. See [Security](security.md#what-you-set) for removing old service account keys, restricting API keys, and repository access.

Missing roles show up as `403` errors such as `Permission denied to get service` (Service Usage), a failed `firebaserules.googleapis.com` `:test` request (Rules) or `Failed to list functions` (Cloud Functions).

Pull requests from forks cannot get a token, so they do not deploy a preview. Their config is still checked.

The first deploy, from `./hb init` or `./hb deploy`, runs with your own account. It enables the APIs and grants Google's service agents the roles functions need. `./hb init` creates the Firestore database before it, in the location you pick. The deploy account can't do these, so if a new kind of function needs another API, deploy once from your computer.

## See also

- [Edit on GitHub](edit-on-github.md)
- [Security](security.md)
- [Firebase project](firebase-project.md)
- [Upgrade](upgrade.md)
