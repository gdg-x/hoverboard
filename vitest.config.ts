import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig, type TestProjectInlineConfiguration } from 'vitest/config';
import { decorators } from './packages/web/build/decorators';
import { configPaths, resolveConfig } from './packages/web/build/resolve-config';
import { siteModule } from './packages/web/build/vite-plugin-site';
import { FEATURES } from './packages/web/src/config/features';

const webRoot = fileURLToPath(new URL('./packages/web', import.meta.url));
const siteConfig = resolveConfig({ paths: configPaths(webRoot), nodeEnv: 'test' });
// The locale that packages/web/__tests__/fake-locale.global-setup.ts builds.
const FAKE_LOCALE = 'en-XA';

const web = {
  plugins: [decorators(), siteModule(siteConfig, { defineFeatures: false })],
  // Vitest resolves lit-html's `isServer` with the Node condition (true), which
  // makes Lit controllers skip browser setup under jsdom.
  resolve: {
    alias: {
      'lit-html/is-server.js': fileURLToPath(
        new URL('./packages/web/node_modules/lit-html/development/is-server.js', import.meta.url),
      ),
    },
  },
  test: {
    name: 'Web',
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        // Match jest-environment-jsdom's default testURL so tests that
        // assert on absolute URLs (e.g. window.location) stay stable.
        url: 'http://localhost/',
      },
    },
    globalSetup: ['./packages/web/__tests__/localize.global-setup.ts'],
    setupFiles: ['./packages/web/__tests__/web.setup.ts'],
    // `lit` is inlined so its `isServer` re-export also goes through the alias above.
    server: { deps: { inline: [/@lit-labs\/observers/, /node_modules\/lit\//] } },
    include: [
      'packages/web/*.test.ts',
      'packages/web/src/**/*.test.ts',
      'packages/web/build/**/*.test.ts',
    ],
    exclude: [...configDefaults.exclude, '**/*.smoke.test.ts', '**/*.server.test.ts'],
  },
} satisfies TestProjectInlineConfiguration;

export default defineConfig({
  test: {
    projects: [
      web,
      // One project per feature, so each renders the app in a fresh environment, with modules
      // that read the flags on import loaded with that feature off.
      ...FEATURES.map((feature): TestProjectInlineConfiguration => ({
        ...web,
        test: {
          ...web.test,
          name: `Smoke (${feature} off)`,
          include: ['packages/web/src/hoverboard-app.smoke.test.ts'],
          exclude: configDefaults.exclude,
          provide: { featureOff: feature },
        },
      })),
      {
        ...web,
        // Loads locales from the pseudo-translated build in test-locales/, so the fake locale stays
        // out of the other projects and of production builds.
        plugins: [
          {
            name: 'fake-locales',
            enforce: 'pre',
            transform(code, id) {
              if (!id.endsWith('/src/utils/localization.ts')) return;
              return code.replaceAll('../generated/locales/', '../generated/test-locales/');
            },
          },
          decorators(),
          siteModule(
            {
              ...siteConfig,
              contentTranslations: { [FAKE_LOCALE]: { title: `[${siteConfig.resources.title}]` } },
            },
            { defineFeatures: false },
          ),
        ],
        test: {
          ...web.test,
          name: 'Smoke (fake locale)',
          globalSetup: [
            ...web.test.globalSetup,
            './packages/web/__tests__/fake-locale.global-setup.ts',
          ],
          include: ['packages/web/src/localization.smoke.test.ts'],
          exclude: configDefaults.exclude,
        },
      },
      {
        test: {
          name: 'Smoke (build)',
          environment: 'node',
          include: ['packages/web/build/**/*.smoke.test.ts'],
          testTimeout: 5 * 60 * 1000,
          hookTimeout: 5 * 60 * 1000,
        },
      },
      {
        // Renders components with Lit SSR, as the build does. `isServer` is true here.
        plugins: [decorators(), siteModule(siteConfig)],
        test: {
          name: 'Server',
          environment: 'node',
          setupFiles: ['./packages/web/__tests__/server.setup.ts'],
          include: ['packages/web/src/**/*.server.test.ts'],
        },
      },
      {
        test: {
          name: 'Functions',
          environment: 'node',
          setupFiles: ['./packages/server/functions/__tests__/functions.setup.ts'],
          include: ['packages/server/functions/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'CLI',
          environment: 'node',
          include: ['packages/cli/src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'Translations',
          environment: 'node',
          include: ['packages/translations/__tests__/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'Firestore',
          environment: 'node',
          // Starts/stops the Firestore emulator once for the whole run (not
          // per test file), since spinning it up is slow.
          globalSetup: ['./packages/storage/__tests__/rules/globalSetup.ts'],
          setupFiles: ['./packages/storage/__tests__/rules/setup.ts'],
          include: ['packages/storage/__tests__/rules/*.rules.test.ts'],
        },
      },
    ],
  },
});
