# Edit on GitHub

Change your site's config and content in the GitHub web editor without installing anything locally, and check a live preview on every pull request.

**For:** [content editors](../README.md#content-editor), [first-time organizers](../README.md#first-time-organizer) and [returning organizers](../README.md#returning-organizer).

## Before you start

Set up the GitHub Actions deploy workflows first with `./hb setup-github`. See [Deploy](deploy.md#deploying-to-firebase-with-github-actions).

## Edit and preview a change

1. Open the file in `packages/config` on GitHub, for example `content/resources.json`, and select the pencil icon. To edit several files at once, press `.` on the repository page to open github.dev.
1. Make your change. Keep the JSON valid: quotes around keys and text, commas between items, and no comma after the last item.
1. Select **Commit changes**, choose **Create a new branch for this commit and start a pull request**, then **Propose changes** and **Create pull request**.
1. The `Deploy Preview` workflow checks the config with `./hb config validate` first. If the config has errors, the `validate_config` check fails and nothing deploys. Each error shows on its file in the **Files changed** tab (verify). Fix them by editing the file on the pull request's branch.
1. When the check passes, a comment on the pull request links to the preview site. It expires after a day, and every new commit updates it.
1. Merge the pull request. The `Deploy` workflow publishes the change to the live site.

The preview reads content from your production Firestore, so it shows the same sessions and speakers as the live site. Changes to Cloud Functions, security rules, and features that the functions read only take effect after the merge.

Pull requests from forks are checked, but do not get a preview. Edit as a collaborator of the repository instead.

## See also

- [Content](content.md)
- [Deploy](deploy.md)
- [Configuration reference](../reference/configuration.md)
