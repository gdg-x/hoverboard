# AGENTS.md

Hoverboard is a conference website template. Organizers fork it, configure it and deploy it to their own Firebase project. The web app is Lit components that Astro renders to static pages at build time, from the site's content in Firestore. The pages then hydrate in the browser and keep the content live. Cloud Functions send notifications.

## Layout

| Path                        | What it is                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `packages/web`              | The web app: Astro pages, Lit components, Redux Toolkit store, Workbox service worker                              |
| `packages/server/functions` | Cloud Functions (v2 API). Must stay self-contained, because `firebase.json` deploys it alone                       |
| `packages/cli`              | The `hb` CLI (`./hb <command>`), run with `tsx`, no build step                                                     |
| `packages/storage`          | Firestore and Storage security rules, indexes, the content schema and the rules tests                              |
| `packages/translations`     | UI translations (XLIFF) from upstream's Crowdin project, read by `packages/web`. No dependencies                   |
| `packages/config`           | The site's own config and content: `site.json`, `content/resources.json`, FAQ, code of conduct, blog posts         |
| `packages/web/defaults`     | Upstream `site.json` defaults that `packages/config` overrides. Objects merge, and arrays and other values replace |
| `docs/`                     | Tutorials and the release policy                                                                                   |

Each package with dependencies has its own `package.json` and `package-lock.json`. The root is a thin orchestrator: its scripts delegate with `npm --prefix ./packages/<name>`.

## Setup

- Node.js and npm versions come from `engines` in the root `package.json`. CI uses the same file.
- `npm ci` at the root also installs every package through `postinstall`.
- Java is needed for the Firestore emulator, which the rules tests and `npm start` use.
- Production Firestore commands sign in with the Firebase CLI login (`npx firebase login`). There are no service account key files.

## Commands

Run from the repo root.

| Command                        | Does                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test`                     | All Vitest projects: Web, Server, Hydration, Functions, CLI, Firestore (starts the emulator), Translations and Smoke                                   |
| `npx vitest run --project Web` | One project. Add a path to run one file                                                                                                                |
| `npm run lint`                 | ESLint, Prettier, syncpack, lit-analyzer, site config, `astro check` and type checks for web, server and storage                                       |
| `npm run fix`                  | ESLint and Prettier autofix                                                                                                                            |
| `npm run build`                | Production build of every page to `packages/web/dist`. Reads content from the Firestore emulator, see `FIRESTORE_TARGET` below                         |
| `npm start`                    | Emulators, functions and the Astro dev server at http://localhost:4321                                                                                 |
| `npm run serve`                | Builds from the emulator data, then serves `dist` on the Hosting emulator at http://localhost:5000                                                     |
| `./hb doctor`                  | Checks the local setup, Firebase login, project, billing plan, deployed functions, deploy roles, service account keys and browser API keys             |
| `./hb init`                    | Sets up a site: Firebase project and web app, event details in `packages/config`, billing, first deploy. Changes production, so only run it when asked |

Before finishing a change, run `npm run lint` and `npm test`, or at least the affected Vitest project and type check.

## Conventions

- **TypeScript** is strict, with `verbatimModuleSyntax`. Use `import type` for type-only imports. Custom elements register as a side effect, so import them with `import './my-element'` where they are used.
- **Components** use `@customElement`, extend `ThemedElement` (which adds the shared theme styles), and read store state with the `@fromStore` decorator. Use the color tokens from `src/themes/tokens.ts` as CSS variables, never hex colors. A test fails on hex colors outside `src/themes/`.
- **Pages** are Astro files in `src/routes/`. `build/routes.ts` adds the pages of enabled features, and `src/pages/` has the pages every site has. Each page reads its content with `loadContent()`, passes the collections its components read to `seedPage()` in its frontmatter, and renders its view with `client:load`. Components render on the server first, so their first render in the browser must match: no `window`, `document`, randomness or viewport checks before `firstUpdated()`. Use CSS media queries for layout by screen size.
- **Build content** comes from `FIRESTORE_TARGET`: unset reads the emulator, `production` reads production Firestore (deploys only), and `none` builds without content (CI checks and smoke tests).
- **CSP.** `build/csp.ts` adds the same Content-Security-Policy to every built page, with the hashes of the inline scripts. Inline scripts must be in the `<head>` (`<Fragment slot="head">` in a page), or the build fails. A new origin the site loads from goes in `cspPolicy()`. `npm start` runs without the policy, so check with `npm run serve`.
- **Site config.** Client code reads site config only through `src/config/site.ts`, never from the data files directly. Build-time config reads live in `packages/web/build/`. When you add or rename a key in `packages/config` or `packages/web/defaults`, update the schema in `packages/web/schemas/` too. `./hb validate-config` checks it.
- **UI text** uses `msg()` from `@lit/localize` with an explicit `id` such as `footer.locale-picker.label`. After adding or changing one, run `npm --prefix packages/web run localize:extract` and commit `packages/translations/source/en.xlf`. `npm run lint` fails when it is out of date.
- **Tests** sit next to the code as `*.test.ts`. Web tests run in jsdom: render with `fixture` from `packages/web/__tests__/helpers/fixtures.ts`, set state with `setStoreState`, turn features off with `setFeatures` from `helpers/features.ts`, switch locale with `useLocale` from `helpers/locale.ts` (only the `Smoke (fake locale)` project has a second locale), and assert with the jest-dom matchers. Every bug fix or feature needs a test.
- **Server tests** are `*.server.test.ts` files in the `Server` project. They render components with Lit SSR in Node, as the build does: fill the store with `seedPage()` from `src/data/page.ts`, then render with `render()` from `@lit-labs/ssr`. A component that reads content the page did not seed fails with "db is not available on the server".
- **Hydration tests** are in the `Hydration` project. Its global setup renders each page in `packages/web/__tests__/fixtures/hydration-pages.ts` with Lit SSR, and `pages.hydration.test.ts` hydrates them in jsdom. It fails when the first client render does not match the server HTML. Add a page there when a component renders differently in the browser.
- **Smoke tests** are `*.smoke.test.ts` files in their own Vitest projects. `features.smoke.test.ts` builds the site once per feature with that feature off (`--project 'Smoke (blog off)'`), and checks its pages, links and chunks are gone. `build.smoke.test.ts` builds the minimal site in `packages/web/__tests__/fixtures/minimal-site`. Run them all with `npx vitest run --project 'Smoke*'`.
- **Features** are gated with `__HB_FEATURES__.<name>` where the code of a disabled feature should be left out of the build. The build replaces it with `true` or `false`. Use `isFeatureEnabled(name)` only for names known at runtime.
- **Vitest** is configured once in the root `vitest.config.ts`. Do not add `vitest` to a package's `package.json`, because a second copy breaks `expect.extend` from setup files.
- **Dependencies** shared by several packages must use the same version range. `npm run lint:syncpack` checks this.
- **Paths.** Astro and Vite run with `packages/web` as the working directory, so their relative paths resolve from there. `packages/config` is `../config`.
- **Local development** always uses the `demo-hoverboard` project on the emulators, whatever `firebase use` selects. The web app connects to the emulators and skips Analytics and Performance Monitoring when the project ID starts with `demo-`.
- **Firestore commands** (`./hb firestore-*`) use the emulator by default. Only target production with `FIRESTORE_TARGET=production` when explicitly asked.
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
