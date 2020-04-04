/* eslint-env node */

module.exports = {
  projects: [
    {
      displayName: 'Web',
      testMatch: ['<rootDir>/src/**/*.test.ts'],
    },
    {
      displayName: 'Firestore',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/**/*.rules.test.ts'],
    },
  ],
};
