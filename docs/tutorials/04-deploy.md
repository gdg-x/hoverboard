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
     ./hbd deploy
   ```

   `./hbd deploy` checks your Node.js version and Firebase project first, prints which project it's about to deploy to, and asks for confirmation before building and deploying. Run `./hbd deploy --yes` to skip the confirmation prompt, e.g. in a scripted context.

   The build renders every page from the content in your production Firestore. It reads it with your Firebase CLI login (`npx firebase login`). After you change content in Firestore, deploy again to update the pages. Visitors' browsers still load the latest content after the page loads.

   The URL to your live site is listed in the output.

## Continuous integration with Github Actions

In the [`.github/workflows`](.github/workflows) folder, you can find two workflows to help you develop and deploy Hoverboard to Firebase:

- [`main.yaml`](.github/workflows/main.yaml) Builds the project, runs the linter and the tests on every push.
- [`deploy-preview.yaml`](.github/workflows/deploy-preview.yaml) Checks `packages/config` with `./hbd validate-config`, then deploys a preview of the website to Firebase after every push to a pull request. Functions and Firestore rules are not deployed. See [Editing on GitHub](01-configure-app.md#editing-on-github).
- [`deploy.yaml`](.github/workflows/deploy.yaml) Deploys the project to Firebase after every push to the `main` branch. You can also run it by hand, for example after you change content in Firestore: open **Actions** > **Deploy** > **Run workflow** on GitHub, or run `gh workflow run deploy.yaml`. It only deploys from `main`.

The `main.yaml` workflow is already configured and will work out of the box, once you fork the hoverboard repo.
To run the two `deploy` actions on your instance, you need to do a couple of small setup:

### Deploying to Firebase with Github Actions

Both workflows deploy to `firebase.projectId` from `packages/config/site.json`. You don't need to edit them.

Both workflows sign in to Google Cloud with Workload Identity Federation. GitHub gives each run a short-lived token, so there is no service account key to store or rotate. Only workflows in your repository can use it. Set it up once:

```console
  ./hbd setup-github --dry-run
  ./hbd setup-github
```

The command uses your Firebase CLI login. It needs the Owner role, or permission to create service accounts, workload identity pools and IAM bindings. It is safe to run again. It:

1. Enables the IAM, IAM Credentials, Security Token Service and Cloud Resource Manager APIs.
1. Creates a `github-deploy` service account with the `Firebase Admin`, `Firebase Rules Admin`, `Cloud Functions Admin`, `Cloud Run Admin`, `Artifact Registry Writer`, `Service Usage Admin` and `Service Account User` roles.
1. Creates a `github` workload identity pool and provider that only accept tokens from your repository. It reads the repository from the `origin` remote. Pass `--repo owner/name` to choose another one.
1. Sets the `WIF_PROVIDER` and `DEPLOY_SERVICE_ACCOUNT` repository variables with the [GitHub CLI](https://cli.github.com/). Without it, the command prints the values to add in the repository settings.

If the auth step fails with `must specify exactly one of "workload_identity_provider" or "credentials_json"`, the repository variables are missing. Run `./hbd setup-github`.

`./hbd doctor` checks the Google Cloud and GitHub setup. It warns about anything `./hbd setup-github` would still change.

Missing roles show up as `403` errors such as `Permission denied to get service` (Service Usage), a failed `firebaserules.googleapis.com` `:test` request (Rules) or `Failed to list functions` (Cloud Functions).

Pull requests from forks cannot get a token, so they do not deploy a preview. Their config is still checked.

You can now push to your `main` branch and it'll deploy to the production (`live`) Firebase Hosting channel and pull requests will deploy a temporary preview.
