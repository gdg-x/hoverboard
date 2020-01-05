const firebase = require('@firebase/testing');
const fs = require('fs');

const loadRules = (projectId, path) => {
  return firebase.loadFirestoreRules({
    projectId,
    rules: fs.readFileSync(path, 'utf8'),
  });
}

module.exports.setup = async (auth, data) => {
  const projectId = `rules-spec-${Date.now()}`;
  const app = await firebase.initializeTestApp({
    projectId,
    auth
  });
  const db = app.firestore();

  if (data) {
    await loadRules(projectId, '__tests__/firestore.rules', 'utf8');

    for (const key in data) {
      await db.doc(key).set(data[key]);
    }
  }

  await loadRules(projectId, 'firestore.rules', 'utf8');

  return db;
};

module.exports.teardown = async () => {
  return Promise.all(firebase.apps().map(app => app.delete()));
};

expect.extend({
  async toAllow(x) {
    let pass = false;
    try {
      await firebase.assertSucceeds(x);
      pass = true;
    } catch (err) {}

    return {
      pass,
      message: () => 'Expected Firebase operation to be allowed, but it was denied'
    };
  }
});

expect.extend({
  async toDeny(x) {
    let pass = false;
    try {
      await firebase.assertFails(x);
      pass = true;
    } catch (err) {}
    return {
      pass,
      message: () =>
        'Expected Firebase operation to be denied, but it was allowed'
    };
  }
});
