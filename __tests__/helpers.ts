import * as firebase from '@firebase/testing';
import * as fs from 'fs';

const loadRules = async (projectId: string, path: string) => {
  await firebase.loadFirestoreRules({
    projectId,
    rules: fs.readFileSync(path, 'utf8'),
  });
};

export const setup = async (auth?: object, data?: object) => {
  const projectId = `rules-spec-${Date.now()}`;
  const app = firebase.initializeTestApp({
    projectId,
    auth,
  });
  const db = app.firestore();

  if (data) {
    await loadRules(projectId, '__tests__/firestore.rules');

    for (const key in data) {
      if ({}.hasOwnProperty.call(data, key)) {
        await db.doc(key).set(data[key]);
      }
    }
  }

  await loadRules(projectId, 'firestore.rules');

  return db;
};

export const teardown = async () => {
  return Promise.all(firebase.apps().map((app) => app.delete()));
};

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
