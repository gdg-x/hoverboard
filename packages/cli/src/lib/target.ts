import { resolveFirebaseProjectId } from '../utils/firebase-project.js';

/** Where the data commands read and write: the local emulator, or the project in site.json. */
export type Target = 'emulator' | 'production';

let current: Target = 'emulator';

/** Picks the target. Set it before anything imports `lib/firestore.js`, which reads it once. */
export const setTarget = (target: Target): void => {
  current = target;
};

export const target = (): Target => current;

/** The production project when the target is production. Undefined for the emulator. */
export const productionProjectId = (repoRoot: string): string | undefined =>
  current === 'production' ? resolveFirebaseProjectId(repoRoot) : undefined;
