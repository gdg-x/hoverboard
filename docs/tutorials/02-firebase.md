# Configure your app with Firebase

In case to have Authentication and My Schedule features, you'll need a Firebase project and your specific configuration data that has a few details about your project.

1. Create a Firebase project in the [Firebase console](https://console.firebase.google.com/), if you don't already have one.

- If you already have an existing Google project associated with your app, click _Import Google Project_. Otherwise, click _Create New Project_.
- If you already have a Firebase project, click _Add App_ from the project overview page.

1. Click _Add Firebase to your web app_.

1. Import initial data to the Firebase Database

   - Generate `serviceAccount.json` file
     - Go to [console.firebase.google.com](https://console.firebase.google.com) -> Project settings -> Service accounts
     - Ensure that **Node.js** is selected and press **Generate new private key**
     - Read the warning and press **Generate key**
     - Save the file as `serviceAccount.json` and to the root of your hoverboard directory (❗Do NOT commit this file to the public repository)
     - Enable Firestore in web console at [console.firebase.google.com](https://console.firebase.google.com) -> Database -> Cloud Firestore -> Create database. Select **locked mode** and press **Enable**
   - [Optional] You can edit `docs/default-firebase-data.json)` file using your own data
   - Select your Firebase project `npx firebase use <projectId>`
     - [Optional] If you need to clear out all of your data first, run `npx firebase firestore:delete --recursive --all-collections`
     - Run `npm run firestore:init`

1. Whoa! You've set up Firebase into your app.

_Tip: Check out [firestore utils](firebase-utils.md) docs_
