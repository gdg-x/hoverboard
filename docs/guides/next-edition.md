# Next edition

Start the next year's edition in a new Firebase project while keeping every earlier edition online as a read-only archive.

**For:** [returning organizers](../README.md#returning-organizer) and [fork maintainers](../README.md#fork-maintainer).

Each edition has its own Firebase project, so the current site starts on the free quota and archived editions stay read-only and free (after moving back to the Spark plan):

| Edition | Firebase project  | Address            | Functions | In the browser           |
| ------- | ----------------- | ------------------ | --------- | ------------------------ |
| 2027    | `devfest-ua`      | `2027.example.com` | Deleted   | Reads only               |
| 2028    | `devfest-ua-2028` | `example.com`      | Yes       | Reads and visitor writes |

`firebase.projectId` in `packages/config/site.json` names the current edition, and `packages/config/editions.json` lists the archives with their year, git tag, project and address. See [How it works](../how-it-works.md#editions).

Starting the next edition takes two commands, with the domain move between them, so the current site keeps working until the new one is ready.

## What carries over

| Data                                                                | On a new edition                                                                                                 |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Auth users                                                          | Copied with their user IDs, so the data that moves still matches its owner. Users with a password are left out   |
| `blog`, `profiles`, `config/notifications`                          | Move. They're deleted from the archive                                                                           |
| `previousSpeakers`                                                  | Copied, with this year's speakers and their sessions added                                                       |
| `team`, `partners`, `gallery`, `videos`                             | Copied, so the new site starts from last year's. The archive keeps its own                                       |
| `sessions` with their feedback and reactions, `speakers`, `tickets` | Stay in the archive                                                                                              |
| `subscribers`, `potentialPartners`                                  | Stay in the archive. Export them for your mailing lists with `./hb data export --csv --production`               |
| `notificationsSubscribers`, `notificationsUsers`                    | Deleted. Push tokens belong to the old project, so visitors turn notifications on again on the new site (verify) |
| `featuredSessions`, `notifications`, `sentNotifications`            | Deleted from the archive. They only mean something while the edition is current                                  |

The archive's reactions show their counts, without the names of the people who reacted, since the profiles moved.

## Before you start

- Use a custom domain, such as `example.com`. It moves to each new edition, and the archive takes a subdomain such as `2027.example.com`. Without one, the site's address is the project's `.web.app` address, which changes each edition.
- Set up GitHub deploys with `./hb setup-github`. The new edition reuses its service account: `./hb edition new` grants it the deploy roles in the new project with `./hb setup-github --project <id>`. Keep the first project, where the account lives (verify a deploy to a new edition from GitHub Actions).
- A Google account can only create a limited number of projects (verify the quota).

## Start the next edition

```console
./hb edition new --project devfest-ua-2028 --dry-run
./hb edition new --project devfest-ua-2028
```

It prepares the next edition, and the current site doesn't change:

1. Checks the data with `./hb data check --production`.
2. Creates the project with a web app, unless it exists. It needs the Blaze plan for the functions: when the project has no billing, it stops with a link. Link it to a billing account, then run the command again.
3. Backs up the current edition with `./hb backup create --production`, and tags the current commit `edition/<year>`, from `event.startDate`, and pushes the tag.
4. Creates the Firestore database in the current one's location, and lets the deploy account deploy to the new project.
5. Copies [what carries over](#what-carries-over) and the Auth users. A speaker whose photo is on another site is listed, since the photo may disappear: copy it to `packages/config/public`.
6. Points `site.json` at the new project, clears the tracks' days and the attending page's doors, and commits.
7. Deploys the new edition, which shows at its `.web.app` address for checking.

Then update the name, dates, venue and ticket link with `./hb init --project <id>`, and the hero texts that mention the year.

## Move the domain and archive the old edition

In the Firebase console, under **Hosting**, remove your domain from the old project and add it to the new one, then update its DNS records. Add a subdomain, such as `2027.example.com`, to the old project (verify the steps).

Once the domain points at the new edition:

```console
./hb edition switch --archive-url https://2027.example.com/ --dry-run
./hb edition switch --archive-url https://2027.example.com/
```

It archives the old project:

1. Copies the profiles and Auth users written since `edition new` to the new project.
2. Backs up the old project.
3. Deletes its functions, deploys the archive rules from `packages/storage/firestore.archive.rules`, and deletes what moved and what's deleted, and its Auth users.
4. Builds the archive from its tag, with the archive settings, and deploys it to the old project.
5. Moves the backup schedule and point-in-time recovery to the new project.
6. Records the edition in `packages/config/editions.json`, and commits.

Then move the old project back to the Spark plan in the Firebase console, so the archive costs nothing.

## Manage the archives

```console
./hb edition list
./hb edition feedback 2027
./hb edition rebuild 2027
```

- `edition list` shows the current edition and each archive, with its address, project and Hoverboard version.
- `edition feedback [year]` writes each session's ratings and comments to `feedback-<year>/<session>.csv`, with `sessions.csv` for the averages, so you can send them to speakers. Without a year it reads the current edition: add `--production`. The files have no user IDs.
- `edition rebuild <year>` builds an archive again from its tag and deploys it, for example after a security fix.

An archived build turns off `blog`, `demo`, `feedback`, `forkMe`, `functions`, `mySchedule`, `notifications` and `subscribe`, hides the partner form and sign-in, and sets `archive` in `site.json` to its year and the current edition's address. The build fails when an archive has one of those features on. See [Features reference](../reference/features.md#archived-editions) and [Security](security.md#archived-editions).

## See also

- [Run your event](run-your-event.md)
- [Backups](backups.md)
- [Security](security.md#archived-editions)
- [CLI reference](../reference/cli.md#hb-edition)
