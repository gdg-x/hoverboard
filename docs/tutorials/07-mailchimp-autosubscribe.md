This tutorial describes how to enable the MailChimp auto subscription feature. So, when a user subscribes to your website, they will be automatically added to the subscription list on MailChimp.

It needs the `mailchimp` and `subscribe` features, which are on by default ([Features](01-configure-app.md#features)).

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

## Confirmation

New subscribers join the list as pending, and Mailchimp emails them to confirm (double opt-in). They are only subscribed once they confirm, so nobody can sign up someone else's address. You can change the confirmation email in Mailchimp's signup form settings (verify the menu path).

People who are already on the list are left as they are, so sending the form again can't unsubscribe them or change their name.
