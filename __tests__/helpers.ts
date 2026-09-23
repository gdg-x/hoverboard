import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { expect } from 'vitest';

expect.extend({
  async toAllow(pr: Promise<any>) {
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
  async toDeny(pr: Promise<any>) {
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
  // @testing-library/jest-dom's own `Assertion<T>` augmentation (types/vitest.d.ts)
  // has a single type parameter, while Vitest 5 declares `Assertion<R, T>` with two.
  // TypeScript requires every declaration merged into `Assertion` to share an
  // identical type parameter list, so adding this augmentation alongside
  // jest-dom's surfaces that pre-existing mismatch as an error here.
  // See https://github.com/testing-library/jest-dom/issues/738.
  // @ts-expect-error -- upstream jest-dom/vitest type parameter mismatch (see above)
  interface Assertion<R extends void | Promise<void> = void> {
    toDeny: () => R;
    toAllow: () => R;
  }
  interface AsymmetricMatchersContaining {
    toDeny: () => void;
    toAllow: () => void;
  }
}
