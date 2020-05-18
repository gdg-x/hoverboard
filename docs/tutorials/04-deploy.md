# Deploy to Firebase

1.  Create [Firebase account](https://console.firebase.google.com) and login into [Firebase CLI](https://firebase.google.com/docs/cli/):

```bash
npx firebase login
```

1.  Select the Firebase project to deploy to

```bash
npx firebase use <projectId>
```

1.  Build and deploy with `/config/production.json`

```bash
npm run deploy
```

    or to deploy with a custom config pass the name of the config file. For example with `/config/custom.json`

```bash
BUILD_ENV=custom npm run deploy
```

    The URL to your live site is listed in the output.

### Continuous integration with Github Actions

In the [`.github/workflows`](.github/workflows) folder, you can find two workflows to help you develop and deploy Hoverboard to Firebase:

- [`pre-merge.yaml`](.github/workflows/pre-merge.yaml) Builds the project, runs the linter and the tests on every Pull Request
- [`deploy.yaml`](.github/workflows/deploy.yaml) Deploys the project to Firebase after every merge to `master`.

The `pre-merge` workflow is already configured and will work out of the box, once you fork the hoverboard repo.
To run the `deploy` on your instance instead, you need to do a small setup:

#### Deploying to Firebase wiht Github Actions

First, make sure that you're able to deploy locally correctly with the command:

```bash
npm run deploy
```

If the deploy is successful, you can then configure Github Actions to do it for you.
You need to generate a login token for the CI with the following command:

```bash
npx firebase login:ci
```

Once you obtained the token, you need to store it as a **secret** called `FIREBASE_TOKEN` in the settings of your repository.
More details on this process can be found here: [Creating and storing encrypted secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets).

Finally, you need to update your `project-id` inside the `deploy.yaml` file to match your project ID where you want to publish:

    ```yaml
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy
        env:
          # Change your project ID here according to your configuration
          PROJECT_ID: hoverboard-master
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
    ```

So you can replace `hoverboard-master` with your specific project ID.

Push this change to `master`, and Github Actions will deploy your project to Firebase after every commit.

Enjoy
