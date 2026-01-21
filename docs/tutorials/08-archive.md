# Archive previous events

Conferences commonly happen every year and it's nice to have archived version if previous years to give attendees a look into what to expect. Follow this guide to take a live Hoverboard install and archive it to another Firebase project.

This guide will walk you through creating a Firebase project and moving the schedule to it creating a snapshot. The current site will keep the blog posts to prevent those links from breaking.

## Notes

- Both Firebase projects will have to be on the Blaze plan.
- You will have to have the correct permissions for each project, if you are an owner of each you're all set.

## Terms

### Source project

This is the Firebase project for the main site for your event. It probably has a domain mapped to it (e.g. `example.com`) and each year it hosts the current event info. It'll have a firebase project id like `devfest` or `devfest-d3850`. This is `SOURCE_PROJECT_ID`. Wherever you see `SOURCE_PROJECT_ID` or `[SOURCE_PROJECT_ID]`, replace them with the actual project id.

### Destination project

In the guide you'll create a new Firebase project where last years archive will live. This is `DESTINATION_PROJECT_ID`. Wherever you see `DESTINATION_PROJECT_ID` or `[DESTINATION_PROJECT_ID]`, replace them with the actual project id. which can be anything but it's recommended to go with conference name and the year of the archive. In this case if we are about to publish the site for 2020, the previous years archive would be `devfest-2019`. In the guide you'll want to map a subdomain to this like `2019.devfest.com`.

## Create firebase project

### Add a new Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and select add project
1. Give it a name
1. Leave Google Analytics enabled
1. Assign Google Analytics to an account
1. Create the account
1. [Create Firestore database](https://console.firebase.google.com/project/_/firestore) in production mode

### Map domain

1. Go to the new (destination) project's [Hosting settings page](https://console.firebase.google.com/project/_/hosting)
1. Select "Get started" and click through the setup steps
1. Click "add custom domain" and follow instructions to [connect a custom domain](https://firebase.google.com/docs/hosting/custom-domain)
   - `year.example.com` is the recommended pattern
1. The domain will take a couple of hours/days to start working

## Copy firestore data

Follow Firebase's [move data between projects](https://firebase.google.com/docs/firestore/manage-data/move-data) guide to copy the Firestore data from the source project to the destination project.

### Notes

- Make sure each project is on the Blaze plan
- Makes sure you are an owner of each project
- Click on `[SOURCE_PROJECT_ID]` in their guide to edit the commands with the actual project id
- This phase can be performed completely from the browser using Google Cloud Shell
- You'll have to create a storage bucket, it's recommended to name this `source-project-to-destination-project` (e.g. `devfest-to-devfest-2019`)
- When creating the storage bucket, make sure to create it in the source project
- You can skip "disable write operations"
- You can remove `--async` from the commands and not have to check if the operations are complete

### Copy data

In short you'll do the following

1. Start a cloud shell
1. Set source project id
1. Create storage bucket in source project through the UI
1. Export all data to bucket
1. Grant destination project access to bucket
1. Set destination project id
1. Import data to destination firestore from bucket

- It might take a few minutes for the data to start appearing

## Configure and deploy destination site

We'll now configure and deploy the destination site. Replace `2019` with the year the archived site is for and `2020` with the year of the upcoming event.

1. Go to the destination site's [Firestore page](https://console.firebase.google.com/project/_/firestore) and delete the `blog` collection. That will remain on the source project
1. Create a branch as the starting point for the upcoming year. It should contain all of the customizations to your theme/settings/etc
   - `$ git switch --create 2020`
1. Create a branch in git for the archived year if you don't have one already. It should contain all of the customizations to your theme/settings/etc
   - `$ git switch --create 2019`
1. Follow the first half of [Configure your app with Firebase](./02-firebase.md) and copy the destination project config to `develoment.json` and `production.json`
1. Don't forget to update `url` and `googleMapApiKey` in the JSON files
1. Add redirects for the blog from the destination site to the source site in `firebase.json`
   ```json
   {
     "hosting": {
       "redirects": [
         {
           "source": "/blog/",
           "destination": "https://example.com/blog/",
           "type": 301
         },
         {
           "source": "/blog/:post*",
           "destination": "https://example.com/blog/:post",
           "type": 301
         }
       ]
     }
   }
   ```
1. Update the `link` value of `latestPostsBlock` in `data/resources.json` to be a full URL to the source site `https://example.com/blog/`
1. Update the `permalink` value of `navigation` blog object in `data/settings.json` to be a full URL to the source site `https://example.com/blog/`
1. Update the `blog` value of `organizer` object in `data/settings.json` to be a full URL to the source site `https://example.com/blog/`
1. Tell the service worker to not render `index.html` for the blog.
   ```js
   export const workboxConfig = {
     navigateFallbackDenylist: [/\/blog\/.*/],
   };
   ```
1. From the root of the project use the firebase CLI to switch to the destination project
   - `$ npx firebase use DESTINATION_PROJECT_ID`
1. Enable the schedule
   ```json
   {
     "config": {
       "schedule": {
         "enabled": true
       }
     }
   }
   ```

```
1. Deploy a production build of the app to the destination project
 - `$ npm run deploy`

Visit the archived site and verify that all the data is there and blog links redirect to the main domain.

## Configure and deploy new source site

Now that there is an archived version of the previous years event we can make some updates to this year.
```
