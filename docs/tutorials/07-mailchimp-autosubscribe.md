This tutorial describes how to enable the MailChimp auto subscription feature. So, when a user subscribes to your website, they will be automatically added to the subscription list on MailChimp.

## Setup

Set the firebase config variables for Mailchimp configuration (you can find API data on your account)

```json
{
  "config": {
    "mailchimp": {
      "dc": "<DATA_CENTER_FOR_YOUR_ACCOUNT>",
      "listid": "<LIST_ID_YOU_WANT_SUBSCRIBE_TO>",
      "apikey": "<LIST_ID_YOU_WANT_SUBSCRIBE_TO>"
    }
  }
}
```
