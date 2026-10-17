# Development

Set up a local development environment for contributing to Hoverboard, understand the monorepo layout, and run the test suites and linters.

## Requirements

- Node.js and npm in the versions listed under `engines` in [`package.json`](../../package.json).
- Java, for the Firebase Firestore emulator (used by `npm start` and the rules, Firestore and sample data tests).
- Chromium, for the accessibility (`A11y`) tests:

```console
npm ci
npx --prefix packages/web playwright install chromium
```

`npm ci` at the root installs every package in `packages/` through `postinstall`.

## Repository layout

```text
/
├── docs/                       Organizer, reference and contributor documentation, plus sample-data/
├── packages/
│   ├── cli/                    The ./hb CLI (run with tsx, no build step)
│   ├── config/                 A fork's own site config and content (empty in upstream except README.md)
│   ├── demo-config/            Upstream's demo site (site.json, content/, public/), used by tests and as fallback
│   ├── server/functions/       Cloud Functions (2nd gen, self-contained for deployment)
│   ├── storage/                Firestore and Storage rules, indexes, schema, collection registry and rules tests
│   ├── translations/           UI translations (XLIFF) from Crowdin, read by packages/web
│   └── web/                    Astro static build, Lit components, Redux Toolkit store, Workbox service worker
│       ├── build/              Build-time config loading, route generation, CSP, social images and font subsetting
│       ├── defaults/           Default site.json merged beneath the site's config
│       ├── public/             Static assets (overlaid by packages/config/public/)
│       ├── schemas/            JSON Schemas for site.json and content/resources.json
│       └── src/
│           ├── components/     Lit custom elements, grouped by area
│           ├── config/         Client-side site config reader
│           ├── controllers/    Shared Lit reactive controllers
│           ├── data/           Build-time Firestore and sample data loaders and page seeding
│           ├── layouts/        Shared Astro page layout
│           ├── models/         TypeScript data models
│           ├── pages/          Always-built Astro routes (404, offline, manifest.json)
│           ├── routes/         Feature-gated Astro routes
│           ├── store/          Redux Toolkit slices and selectors
│           ├── styles/         Shared CSS tokens, type scale, spacing and motion
│           ├── themes/         Built-in themes (festival, spotlight, paper, glass, minimalist) and tokens
│           ├── utils/          Shared helpers
│           └── views/          Page-level custom elements
```

## Running locally

Start the emulators, Cloud Functions and Astro dev server at http://localhost:4321, and seed the emulator with sample data:

```console
npm start
./hb data seed
```

To test a production build with the Content Security Policy headers on the Hosting emulator at http://localhost:5000:

```console
npm run serve
```

## Tests and linting

Run the linter and all test projects from the repository root before opening a pull request:

```console
npm run lint
npm test
```

`npm run fix` runs ESLint and Prettier autofix.

To run a single Vitest project or a single test file:

```console
npx vitest run --project Web
npx vitest run --project CLI packages/cli/src/docs/links.test.ts
npx vitest run --project 'Stages*'
npx vitest run --project 'Smoke*'
```

Vitest projects in [`vitest.config.ts`](../../vitest.config.ts):

- `Web`: component, store and utility unit tests in jsdom (including axe checks).
- `Server`: Lit SSR server rendering tests in Node.
- `Stages (*)`: SSR tests across event stage fixtures (`first-announced`, `first-call`, `first-tickets`, `first-schedule`, `returning-live`, `returning-ended`, `archived`, etc.).
- `Hydration`: verifies that the first client render in jsdom matches the Lit SSR HTML.
- `Functions`: Cloud Functions unit tests.
- `CLI`: `./hb` command, migration and documentation link tests.
- `Storage`, `Firestore` and `Sample data`: security rules, schema/collection registry consistency and sample data parity (start the Firestore emulator).
- `Translations`: XLIFF translation placeholder and source checks.
- `Smoke (*)` and `A11y`: full Astro builds with individual features turned off, the minimal site, and Playwright + axe WCAG 2.2 AA checks across every theme and color scheme.

## Conventions

See [`AGENTS.md`](../../AGENTS.md) for the codebase conventions: TypeScript, Lit components and theme tokens, Astro pages and SSR hydration, site config, Firestore schema, UI localization (`msg()`), and accessibility requirements.

## See also

- [Releases](releases.md)
- [Accessibility statement](../ACCESSIBILITY.md)
- [AGENTS.md](../../AGENTS.md)
