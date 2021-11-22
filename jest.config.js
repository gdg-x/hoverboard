/* eslint-env node */

// Jest doesn't support ESModules https://github.com/facebook/jest/issues/4842
const esModuleDependencies = [
  '@abraham/remotedata',
  '@lit',
  '@material',
  'lit',
  'pwa-helpers',
  'testing-library__dom',
].join('|');

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
      testEnvironment: 'jsdom',
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
      testMatch: ['<rootDir>/**/*.rules.test.ts'],
    },
  ],
};
