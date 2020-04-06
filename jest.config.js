/* eslint-env node */

// Jest doesn't support ESModules https://github.com/facebook/jest/issues/4842
const esModuleDependencies = ['lit-element', 'lit-html', '@material', 'pwa-helpers'].join('|');

module.exports = {
  projects: [
    {
      displayName: 'Web',
      setupFilesAfterEnv: ['<rootDir>/__tests__/web.setup.ts'],
      testEnvironment: 'jest-environment-jsdom-sixteen',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      transformIgnorePatterns: [`node_modules/(?!${esModuleDependencies})`],
    },
    {
      displayName: 'Firestore',
      setupFilesAfterEnv: ['<rootDir>/__tests__/firestore.setup.ts'],
      testEnvironment: 'node',
      testMatch: ['<rootDir>/**/*.rules.test.ts'],
    },
  ],
};
