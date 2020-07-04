/* eslint-env node */

// Jest doesn't support ESModules https://github.com/facebook/jest/issues/4842
const esModuleDependencies = ['lit-element', 'lit-html', '@material', 'pwa-helpers'].join('|');

module.exports = {
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.test.json',
    },
  },
  projects: [
    {
      displayName: 'Web',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/__tests__/web.setup.ts'],
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      transform: {
        '^.+\\.[t|j]sx?$': 'ts-jest',
      },
      transformIgnorePatterns: [`node_modules/(?!${esModuleDependencies})`],
    },
    {
      displayName: 'Firestore',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/__tests__/firestore.setup.ts'],
      testEnvironment: 'node',
      testMatch: ['<rootDir>/**/*.rules.test.ts'],
    },
  ],
};
