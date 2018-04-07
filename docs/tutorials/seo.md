⚠️ Works only on Blaze plan!

## Setup
1.  Deploy [rendertron](https://github.com/GoogleChrome/rendertron) on your AppEngine
1.  Set the firebase config variables

        firebase functions:config:set rendertron.server="https://YOUR_PROJECT_HERE.appspot.com"


        firebase functions:config:set site.domain="YOUR_SUB_DOMAIN_HERE.firebaseapp.com"

1.  Deploy Firebase functions
  
        firebase deploy --only functions

1.  Done 
