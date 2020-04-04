import * as firebase from '@firebase/testing';

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

declare global {
  // eslint-disable-next-line
  namespace jest {
    interface Matchers<R> {
      toDeny: () => {};
      toAllow: () => {};
    }
  }
}
