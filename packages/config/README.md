# Your site's config

This folder holds your site's own config and content. Hoverboard never changes it, so upgrades don't conflict here.

Run `./hb init` to create it. It copies the demo site from `packages/demo-config`, then asks for your event's details:

- `site.json`: the site settings, over the defaults in `packages/web/defaults/site.json`.
- `content/`: the event text in `resources.json`, the FAQ, the code of conduct and the blog posts.
- `public/`: images, such as the logo, icon and share image. They're served from the site's root, over the files in `packages/web/public`.
- `custom.css`: your own styles, loaded after the theme.

Until this folder has a `site.json`, the build, `npm start` and `./hb` use the demo in `packages/demo-config`, and deploys stop. See [Configure the app](../../docs/tutorials/01-configure-app.md).
