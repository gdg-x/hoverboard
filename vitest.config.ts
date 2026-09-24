import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
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
          setupFiles: ['./packages/web/__tests__/web.setup.ts'],
          include: ['packages/web/src/**/*.test.ts'],
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
