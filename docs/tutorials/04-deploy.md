# Deploy to Firebase

1. Create [Firebase account](https://console.firebase.google.com) and login into [Firebase CLI](https://firebase.google.com/docs/cli/):

   ```console
     npx firebase login
   ```

1. Select the Firebase project to deploy to

   ```console
     npx firebase use <projectId>
   ```

1. Build and deploy with `/config/production.json`

   ```console
     npm run deploy
   ```

   or to deploy with a custom config pass the name of the config file. For example with `/config/custom.json`

   ```console
     BUILD_ENV=custom npm run deploy
   ```

   The URL to your live site is listed in the output.

## Continuous integration with Github Actions

In the [`.github/workflows`](.github/workflows) folder, you can find two workflows to help you develop and deploy Hoverboard to Firebase:

- [`main.yaml`](.github/workflows/main.yaml) Builds the project, runs the linter and the tests on every push.
- [`deploy-preview.yaml`](.github/workflows/deploy-preview.yaml) Deploys a preview of the website to Firebase after every push to a pull request. Functions and Firestore rules are not deployed.
- [`deploy.yaml`](.github/workflows/deploy.yaml) Deploys the project to Firebase after every push to the `main` branch.

The `main.yaml` workflow is already configured and will work out of the box, once you fork the hoverboard repo.
To run the two `deploy` actions on your instance, you need to do a couple of small setup:

### Deploying to Firebase with Github Actions

Make sure you are acting on the correct Firebase project.

```console
  npx firebase use <projectId>
```

Add service account credentials as secrets to your GitHub repo.

```console
npx firebase init hosting:github
```

This will open GitHub in the browser were you should authorize Firebase CLI access. Back in the terminal you will then get a number of questions that should be answered like the following. Watch for a constant name that starts with `FIREBASE_SERVICE_ACCOUNT_` and remember it.

> For which GitHub repository would you like to set up a GitHub workflow?

The username and reponame on GitHub. E.g. `gdg-x/hoverboard`.

> Set up the workflow to run a build script before every deploy?

Answer `no` as this has already been done.

_If the script creates the `.github/workflows/firebase-hosting-pull-request.yml` you can delete it as it's already handled in the `.github/workflows/deploy-preview.yml` file._

> Set up automatic deployment to your site's live channel when a PR is merged?

Answer `no` as this has already been done.

Update [`deploy-preview.yaml`](.github/workflows/deploy-preview.yaml) and [`deploy.yaml`](.github/workflows/deploy.yaml).

1. Replace `FIREBASE_SERVICE_ACCOUNT_HOVERBOARD_MASTER` with the constant that was output to your terminal.
1. Replace `hoverboard-master` to the Firebase Project ID you'll be deploying to. This should match the value used in `npx firebase use`.

You can now push to your `main` branch and it'll deploy to the production (`live`) Firebase Hosting channel and pull requests will deploy a temporary preview.
