# Configure your app with Firebase

In case to have Authentication and My Schedule features, you'll need a Firebase project and your specific configuration data that has a few details about your project.

1. Create a Firebase project in the [Firebase console](https://console.firebase.google.com/), if you don't already have one.

	- If you already have an existing Google project associated with your app, click *Import Google Project*. Otherwise, click *Create New Project*.
	- If you already have a Firebase project, click *Add App* from the project overview page.

1. Click *Add Firebase to your web app*.
1. *Copy* all needed data, then paste it in `config/development.json` (and `config/production.json` if you use the same project in production). This configuration looks like this:

	```
	"firebase": {
    "apiKey": "<REPLACE_ME>",
    "authDomain": "<REPLACE_ME>",
    "databaseURL": "<REPLACE_ME>",
    "projectId": "<REPLACE_ME>",
    "storageBucket": "<REPLACE_ME>",
    "messagingSenderId": "<REPLACE_ME>"
	}
	```
	
1. Import data to the Firebase Database.
	- Generate `serviceAccount.json` file
		- Go to https://console.firebase.google.com/project/%YOUR_PROJECT_ID%/settings/serviceaccounts/adminsdk
		- Ensure that **Node.js** is selected
		- Press **GENERATE NEW PRIVATE KEY**
	- Rename downloaded file to `serviceAccount.json` and place it to the root of your hoverboard directory (❗Do NOT commit this file to the public repository)
	- [Optional] You can edit `docs/default-firebase-data.json)` file using your own data
	- Run `yarn firestore:init`

1. Whoa! You've set up Firebase into your app.

##### Tip: Check out [firestore utils](./firebase-utils.md) docs
