# Deploy to Firebase

Firebase is a very simple and secure way to deploy a Hoverboard site. 
You can sign up for a free account and deploy your application in less than 5 minutes.

The instructions below are based on the [Firebase quick start][Firebase quick start].

1.  [Sign up for a Firebase account][Firebase console]

1.  Install the Firebase command line tools

        npm install -g firebase-tools

    The `-g` flag instructs `npm` to install the package globally so that you
    can use the `firebase` command from any directory. You may need
    to install the package with `sudo` privileges.

1.  `cd` into your project directory

1.  Inititalize the Firebase application

        firebase init

    Running the firebase init command creates a firebase.json settings file 
    in the root of your project directory. Otherwise, go to
    [Firebase console][Firebase console] to create a new app.
    
1.  When you initialize your app, you will be prompted for a directory to 
    use as the public root (default is "public"). Enter `build/bundled` 
    or `build/unbundled` (supports HTTP/2). `build` contains everything 
    your application needs to run.

1.  Edit firebase.json, change firebase name, and add `rewrites` section 
([see example firebase.json](/docs/firebase.json)).

1.  Build

        polymer build

1.  Deploy

        firebase deploy

    The URL to your live site is listed in the output.


[Firebase quick start]: https://firebase.google.com/docs/hosting/quickstart
[Firebase console]: https://firebase.google.com/console/
