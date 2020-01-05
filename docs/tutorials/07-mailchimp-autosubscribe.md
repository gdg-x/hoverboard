This tutorial describes how to enable the MailChimp auto subscription feature. So, when a user subscribes to your website, they will be automatically added to the subscription list on MailChimp.

## Setup

1.  Set the firebase config variables for Mailchimp configuration (you can find API data on your account)
    ```console
      npx firebase functions:config:set mailchimp.dc="<DATA_CENTER_FOR_YOUR_ACCOUNT>" \
                                        mailchimp.listid="<LIST_ID_YOU_WANT_SUBSCRIBE_TO>" \
                                        mailchimp.apikey="<YOUR_API_KEY>"
    ```
1.  Deploy Firebase functions. You can find specific Mailchimp autosubscibe function [here](https://github.com/gdg-x/hoverboard/blob/master/functions/src/mailchimp-subscribe.js)
    ```console
      npx firebase deploy --only functions
    ```
1.  As per the currently existing Firebase subscription plans, the free plan does not support calls to external APIs from Firebase functions (which is being used for the MailChimp integration). This means that you will need another subscription plan - we recommend the Blaze (pay-as-you-go) subscription plan, which is the cheapest option that will allow you to make the integration
