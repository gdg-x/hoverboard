This tutorial describes how to enable Mailchimp autosubscription feature. So that, when user subscribe on your website, he/she will be automatically added to subscription list on Mailchimp.

## Setup
1.  Set the firebase config variables for Mailchimp configuration (you can find API data on your account)
    ```console
      firebase functions:config:set mailchimpConfig.dc="<DATA_CENTER_FOR_YOUR_ACCOUNT>"
                                    mailchimpConfig.listid="<LIST_ID_YOU_WANT_SUBSCRIBE_TO>"
                                    mailchimpConfig.apikey="<YOUR_API_KEY>"
    ```
1.  Deploy Firebase functions. You can find specific Mailchimp autosubscibe function [here](https://github.com/gdg-x/hoverboard/blob/master/functions/src/mailchimp-subscribe.js)
    ```console
      firebase deploy --only functions
    ```
1.  Done 
