/* eslint-disable jest/require-top-level-describe */

import {
  initializeTestEnvironment,
  RulesTestContext,
  RulesTestEnvironment,
  TestEnvironmentConfig,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll } from '@jest/globals';
import { doc, setDoc } from 'firebase/firestore';
import { setup, teardown } from 'jest-dev-server';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  await setup({
    command: 'npx firebase emulators:start --only firestore',
    launchTimeout: 30000,
    port: 8080,
    usedPortAction: 'error',
  });
}, 30000);

afterAll(async () => {
  await teardown();
});

interface SetupApp {
  userId?: string;
  data?: { [key: string]: object };
}

export const setupApp = async ({ userId, data }: SetupApp = {}) => {
  const projectId = `rules-spec-${Date.now()}`;
  const config: TestEnvironmentConfig = {
    projectId,
    firestore: {
      port: 8080,
      host: 'localhost',
    },
  };
  testEnv = await initializeTestEnvironment(config);

  if (data) {
    testEnv.withSecurityRulesDisabled(async (context: RulesTestContext) => {
      for (const key in data) {
        if ({}.hasOwnProperty.call(data, key)) {
          await setDoc(doc(context.firestore(), key), data);
        }
      }
    });
  }

  if (userId) {
    return testEnv.authenticatedContext(userId);
  } else {
    return testEnv.unauthenticatedContext();
  }
};

export const teardownApp = async () => {
  await testEnv.clearFirestore();
  await testEnv.cleanup();
};
