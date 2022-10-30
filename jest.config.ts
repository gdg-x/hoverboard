import { Config } from '@jest/types';
import { InitialOptionsTsJest } from 'ts-jest';

// Jest doesn't support ESModules https://github.com/facebook/jest/issues/4842
const ES_MODULE_DEPENDENCIES = [
  '@abraham/remotedata',
  '@firebase/firestore',
  '@firebase/messaging',
  '@firebase/util',
  '@lit',
  '@material',
  'firebase',
  'lit',
  'pwa-helpers',
].join('|');

const config: InitialOptionsTsJest = {
  projects: [
    {
      displayName: 'Web',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/__tests__/web.setup.ts'],
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
      transform: { '^.+\\.[t|j]sx?$': 'ts-jest' },
      transformIgnorePatterns: [`node_modules/(?!${ES_MODULE_DEPENDENCIES})`],
    } as Config.InitialProjectOptions, // InitialProjectOptions thinks `preset` isn't allowed
    {
      displayName: 'Firestore',
      preset: 'ts-jest',
      setupFilesAfterEnv: ['<rootDir>/__tests__/firestore.setup.ts'],
      testMatch: ['<rootDir>/**/*.rules.test.ts'],
    } as Config.InitialProjectOptions, // InitialProjectOptions thinks `preset` isn't allowed
  ],
};

export default config;
