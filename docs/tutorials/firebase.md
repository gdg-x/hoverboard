# Configure your app with Firebase

In case to have Authentication and My Schedule features, you'll need a Firebase project and your specific configuration data that has a few details about your project.

1. Create a Firebase project in the [Firebase console](https://console.firebase.google.com/), if you don't already have one.

- If you already have an existing Google project associated with your app, click *Import Google Project*. Otherwise, click *Create New Project*.
- If you already have a Firebase project, click *Add App* from the project overview page.

2. Click *Add Firebase to your web app*.
3. Note the initialization code snippet, which you will use in a minute.

The snippet contains initialization information to configure the Firebase JavaScript SDK to use [Authentication](https://firebase.google.com/docs/auth/), [Storage](https://firebase.google.com/docs/storage/) and the [Realtime Database](https://firebase.google.com/docs/database/). 
You can reduce the amount of code your app uses by just including the features you need. The individually installable components are:

- `firebase-app` - The core firebase client (required).
- `firebase-auth` - Firebase Authentication (optional), but in Hoverboard is required for user authentication.
- `firebase-database` - The Firebase Realtime Database (optional), but in Hoverboard is required for storing users' schedule.
- `firebase-storage` - Firebase Storage (optional).
- `firebase-messaging` - Firebase Cloud Messaging (optional).

4. *Copy* all needed data, then paste it in `data/hoverboard.config.json`. This configuration looks like this:

```
   "firebase": {
    "name": "<YOUR_APP_NAME>",
    "domain": "YOUR_FIREBASE_DOMAIN",
    "database": "<YOUR_FIREBASE_DATABASE>",
    "api": "<YOUR_API_KEY>",
    "userSessionsPath": "/userSessions"
  }
```

5. Whoa! You've set up Firebase into your app.

