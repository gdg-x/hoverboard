## Setup

1.  Set the firebase config variables
    ```console
      npx firebase functions:config:set rendertron.server="https://render-tron.appspot.com"
      npx firebase functions:config:set site.domain="YOUR_SUB_DOMAIN_HERE.web.app"
    ```
1.  Deploy Firebase functions
    ```console
      npx firebase deploy --only functions
    ```

`https://render-tron.appspot.com` is provided without uptime guarantees so you may want to [deploy your own version](https://github.com/GoogleChrome/rendertron).
