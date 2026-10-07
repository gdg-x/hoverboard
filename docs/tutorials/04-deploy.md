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
     ./hbd deploy
   ```

   or to deploy with a custom config pass the name of the config file. For example with `/config/custom.json`

   ```console
     BUILD_ENV=custom ./hbd deploy
   ```

   `./hbd deploy` checks your Node.js version and selected Firebase project first, prints which project it's about to deploy to, and asks for confirmation before building and deploying. Run `./hbd deploy --yes` to skip the confirmation prompt, e.g. in a scripted context.

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

Add service account credentials as a secret to your GitHub repo.

1. In the Google Cloud console, create a service account in your project and grant it the `Firebase Admin` role (or narrower roles that cover Hosting, Functions, Firestore and Storage deploys). Also enable the Firebase Management API.
1. Create a JSON key for it and add the contents as a GitHub secret named `FIREBASE_DEPLOY_SERVICE_ACCOUNT`.
1. In [`deploy-preview.yaml`](.github/workflows/deploy-preview.yaml) and [`deploy.yaml`](.github/workflows/deploy.yaml), replace `hoverboard-master` with the Firebase Project ID you'll be deploying to.

You can now push to your `main` branch and it'll deploy to the production (`live`) Firebase Hosting channel and pull requests will deploy a temporary preview.
