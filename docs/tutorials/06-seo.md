## Setup

Set the Firestore config documents through the [console](https://console.firebase.google.com/) or in `default-firebase-data.json` before initial data boostrap.

```json
{
  "config": {
    "rendertron": {
      "server": "https://render-tron.appspot.com"
    },
    "site": {
      "domain": "YOUR_SUB_DOMAIN_HERE.web.app"
    }
  }
}
```

`https://render-tron.appspot.com` is provided without uptime guarantees so you may want to [deploy your own version](https://github.com/GoogleChrome/rendertron).
