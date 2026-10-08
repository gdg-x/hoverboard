# AGENTS.md

Hoverboard is a conference website template. Organizers fork it, configure it and deploy it to their own Firebase project. The web app is built with Lit and Vite, data lives in Firestore, and Cloud Functions handle schedule generation, notifications, image optimization and Mailchimp.

## Layout

| Path                        | What it is                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `packages/web`              | The web app: Lit components, Redux Toolkit store, Vite build, Workbox service worker                       |
| `packages/server/functions` | Cloud Functions (v2 API). Must stay self-contained, because `firebase.json` deploys it alone               |
| `packages/cli`              | The `hbd` CLI (`./hbd <command>`), run with `tsx`, no build step                                           |
| `packages/storage`          | Firestore and Storage security rules, indexes, the content schema and the rules tests                      |
| `packages/translations`     | UI translations (XLIFF) from upstream's Crowdin project, read by `packages/web`. No dependencies           |
| `packages/config`           | The site's own config and content: `site.json`, `content/resources.json`, FAQ, code of conduct, blog posts |
| `packages/web/defaults`     | Upstream defaults that `packages/config` overrides. Objects merge, and arrays and other values replace     |
| `docs/`                     | Tutorials and the release policy                                                                           |

Each package with dependencies has its own `package.json` and `package-lock.json`. The root is a thin orchestrator: its scripts delegate with `npm --prefix ./packages/<name>`.

## Setup

- Node.js and npm versions come from `engines` in the root `package.json`. CI uses the same file.
- `npm ci` at the root also installs every package through `postinstall`.
- Java is needed for the Firestore emulator, which the rules tests and `npm start` use.
- Production Firestore commands sign in with the Firebase CLI login (`npx firebase login`). There are no service account key files.

## Commands

Run from the repo root.

| Command                        | Does                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `npm test`                     | All Vitest projects: Web, Functions, CLI, Firestore (starts the emulator), Translations and Smoke |
| `npx vitest run --project Web` | One project. Add a path to run one file                                                           |
| `npm run lint`                 | ESLint, Prettier, syncpack, lit-analyzer, site config and type checks for web, server and storage |
| `npm run fix`                  | ESLint and Prettier autofix                                                                       |
| `npm run build`                | Production build of the web app to `packages/web/dist`                                            |
| `npm start`                    | Emulators, functions and web app in watch mode                                                    |
| `./hbd doctor`                 | Checks the local setup, Firebase login, project and billing plan                                  |

Before finishing a change, run `npm run lint` and `npm test`, or at least the affected Vitest project and type check.

## Conventions

- **TypeScript** is strict, with `verbatimModuleSyntax`. Use `import type` for type-only imports. Custom elements register as a side effect, so import them with `import './my-element'` where they are used.
- **Components** use `@customElement`, extend `ThemedElement` (which adds the shared theme styles), and read store state with the `@fromStore` decorator. Use the color tokens from `src/themes/tokens.ts` as CSS variables, never hex colors. A test fails on hex colors outside `src/themes/`.
- **Site config.** Client code reads site config only through `src/config/site.ts`, never from the data files directly. Build-time config reads live in `packages/web/build/`. When you add or rename a key in `packages/config` or `packages/web/defaults`, update the schema in `packages/web/schemas/` too. `./hbd validate-config` checks it.
- **Tests** sit next to the code as `*.test.ts`. Web tests run in jsdom: render with `fixture` from `packages/web/__tests__/helpers/fixtures.ts`, set state with `setStoreState`, turn features off with `setFeatures` from `helpers/features.ts`, and assert with the jest-dom matchers. Every bug fix or feature needs a test.
- **Smoke tests** are `*.smoke.test.ts` files in their own Vitest projects. `hoverboard-app.smoke.test.ts` renders the app once per feature with that feature off (`--project 'Smoke (blog off)'`), and `build.smoke.test.ts` builds the minimal site in `packages/web/__tests__/fixtures/minimal-site`. Run them all with `npx vitest run --project 'Smoke*'`.
- **Features** are gated with `__HB_FEATURES__.<name>` where the code of a disabled feature should be left out of the build. The build replaces it with `true` or `false`. Use `isFeatureEnabled(name)` only for names known at runtime.
- **Vitest** is configured once in the root `vitest.config.ts`. Do not add `vitest` to a package's `package.json`, because a second copy breaks `expect.extend` from setup files.
- **Dependencies** shared by several packages must use the same version range. `npm run lint:syncpack` checks this.
- **Paths.** Vite runs with `packages/web` as the working directory, so its relative paths resolve from there. `packages/config` is `../config`.
- **Local development** always uses the `demo-hoverboard` project on the emulators, whatever `firebase use` selects. The web app connects to the emulators and skips Analytics and Performance Monitoring when the project ID starts with `demo-`.
- **Firestore commands** (`./hbd firestore-*`) use the emulator by default. Only target production with `FIRESTORE_TARGET=production` when explicitly asked.
- **Formatting.** Prettier formats everything, including Markdown, JSON and YAML. Run `npx prettier --write <files>` after editing them.
- **Docs** use short, plain sentences. Mark claims that were not tested with "verify".

## Pull requests and releases

- Pull request titles follow [Conventional Commits](https://www.conventionalcommits.org/), for example `fix(web): show session times in the event time zone`. They are squash merged, and the title becomes the release note.
- Mark breaking changes with `!` and explain what organizers must do in a `BREAKING CHANGE:` paragraph. [docs/releases.md](docs/releases.md) defines what counts as breaking.
- release-please opens the release pull request and updates [CHANGELOG.md](CHANGELOG.md). Do not edit the changelog by hand.

## Do not commit

- `serviceAccount.json`, `*-adminsdk-*.json`, `.firebaserc`, or any other credentials.
- Emulator debug logs (`*-debug.log`).
- `NEXT.md` and the planning specs in `docs/` that it lists. They are local working documents. Do not link to them from committed files.
