# Configure your app with Firebase

In case to have Authentication and My Schedule features, you'll need a Firebase project and your specific configuration data that has a few details about your project.

1. Create a Firebase project in the [Firebase console](https://console.firebase.google.com/), if you don't already have one.

	- If you already have an existing Google project associated with your app, click *Import Google Project*. Otherwise, click *Create New Project*.
	- If you already have a Firebase project, click *Add App* from the project overview page.

2. Click *Add Firebase to your web app*.
3. Note the initialization code snippet, which you will use in a minute.

	The **snippet contains initialization** information to configure the Firebase JavaScript SDK to use [Authentication](https://firebase.google.com/docs/auth/), [Storage](https://firebase.google.com/docs/storage/) and the [Realtime Database](https://firebase.google.com/docs/database/). 

	- YOUR_APP_NAME - The Firebase Project name
	- YOUR_FIREBASE_DOMAIN - The Firebase domain
	- YOUR_FIREBASE_DATABASE - The Firebase Realtime Database (for storing users' schedule)
	- YOUR_API_KEY - Web API Key

4. *Copy* all needed data, then paste it in `config/development.json` (and `config/production.json` if you use the same project in production). This configuration looks like this:

	```
	"firebase": {
		"name": "<YOUR_APP_NAME>",
		"domain": "YOUR_FIREBASE_DOMAIN",
		"database": "<YOUR_FIREBASE_DATABASE>",
		"api": "<YOUR_API_KEY>",
		"userSessionsPath": "/userSessions",
		"ratingsPath": "/ratings",
		"indexedDbSession": "hoverboard"
	}
	```
	
5. Import data to the Firebase Database.
	- Generate `serviceAccount.json` file (go to https://console.firebase.google.com/project/%YOUR_PROJECT_ID%/settings/serviceaccounts/adminsdk)
		- Go to https://console.firebase.google.com/project/%YOUR_PROJECT_ID%/settings/serviceaccounts/adminsdk
		- Ensure that `Node.js` is selected
		- Press `GENERATE NEW PRIVATE KEY`
	- Rename downloaded file to `serviceAccount.json` and place it to root of your hoverboard directory (❗Do NOT commit this file to the public repository)
	- [Optional] You can edit `docs/default-firebase-data.json)` file using your own data
	- Run `yarn firestore:init`

6. Whoa! You've set up Firebase into your app.

## Utils
At the moment Firestore admin panel doesn't allow to export/import data from their DB.
These scripts allows you to load data on your machine, edit and bring it back. 
See examples to learn how it works.

#### Save collection/doc to file
```console
    yarn firestore:copy sourcePath fileToSave.json
```
###### Examples:
Save a collection
```console
    yarn firestore:copy partners/1/items general-partners.json
```
Save a document
```console
    yarn firestore:copy partners/1/items/000 gdg-lviv-partner.json
```

#### Load a file to collection/doc 
```console
    yarn firestore:copy fileToLoad.json destinationPath
```
###### Examples:
Load to collection
```console
    yarn firestore:copy general-partners.json partners/1/items
```
Load a document
```console
    yarn firestore:copy gdg-lviv-partner.json partners/1/items/000
```

#### Copy collection->collection or doc->doc
```console
    yarn firestore:copy sourcePath destinationPath
```
###### Examples:
Copy a collection
```console
    yarn firestore:copy speakers backups/08-07-2018/speakers
```
Copy a document
```console
    yarn firestore:copy speakers/yonatan_levin backups/08-07-2018/speakers/yonatan_levin
```
