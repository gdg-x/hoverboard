import * as firebase from '@firebase/testing';
import { expect } from '@jest/globals';

expect.extend({
  async toAllow(pr: Promise<any>) {
    let pass = false;
    try {
      await firebase.assertSucceeds(pr);
      pass = true;
    } catch (err) {
      // no-op
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
      await firebase.assertFails(pr);
      pass = true;
    } catch (err) {
      // no-op
    }
    return {
      pass,
      message: () => 'Expected Firebase operation to be denied, but it was allowed',
    };
  },
});

export { expect };

// https://github.com/facebook/jest/issues/11487
declare module 'expect/build/types' {
  interface Matchers<R> {
    toDeny: () => R;
    toAllow: () => R;
  }
}
