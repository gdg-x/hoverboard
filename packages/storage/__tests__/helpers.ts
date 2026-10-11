import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { expect } from 'vitest';

expect.extend({
  async toAllow(pr: Promise<unknown>) {
    let pass = false;
    try {
      await assertSucceeds(pr);
      pass = true;
    } catch (error) {
      console.log(error);
    }

    return {
      pass,
      message: () => 'Expected Firebase operation to be allowed, but it was denied',
    };
  },
});

expect.extend({
  async toDeny(pr: Promise<unknown>) {
    let pass = false;
    try {
      await assertFails(pr);
      pass = true;
    } catch (error) {
      console.log(error);
    }
    return {
      pass,
      message: () => 'Expected Firebase operation to be denied, but it was allowed',
    };
  },
});

export { expect };

declare module 'vitest' {
  // Both matchers are async, so a missing `await` is a floating promise.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- merging needs vitest's names
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> {
    toDeny: () => Promise<void>;
    toAllow: () => Promise<void>;
  }
}
