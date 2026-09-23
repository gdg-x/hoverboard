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
          setupFiles: ['./__tests__/web.setup.ts'],
          include: ['src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'Functions',
          environment: 'node',
          setupFiles: ['./functions/__tests__/functions.setup.ts'],
          include: ['functions/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'Firestore',
          environment: 'node',
          setupFiles: ['./__tests__/firestore.setup.ts'],
          include: ['**/*.rules.test.ts'],
        },
      },
    ],
  },
});
