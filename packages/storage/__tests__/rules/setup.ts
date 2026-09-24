import {
  initializeTestEnvironment,
  RulesTestContext,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Runs once per test *file* (Vitest isolates each file's module graph), which
// means the ruleset is applied once per suite file via a fast REST call
// against the already-running emulator started in `globalSetup.ts` - not by
// restarting the emulator itself. Data is seeded/cleared per test, which is
// cheap against an already-running emulator.
let testEnv: RulesTestEnvironment;

const rules = fs.readFileSync(path.join(process.cwd(), 'packages/storage/firestore.rules'), 'utf8');

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: `rules-spec-${process.pid}-${Date.now()}`,
    firestore: {
      rules,
      host: 'localhost',
      port: 8080,
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

/** Writes fixture documents bypassing security rules. Keys are Firestore paths. */
export const seed = (data: { [path: string]: object }) =>
  testEnv.withSecurityRulesDisabled(async (context: RulesTestContext) => {
    await Promise.all(
      Object.entries(data).map(([docPath, fields]) =>
        setDoc(doc(context.firestore(), docPath), fields),
      ),
    );
  });

export const authedContext = (userId: string) => testEnv.authenticatedContext(userId);

export const anonContext = () => testEnv.unauthenticatedContext();
