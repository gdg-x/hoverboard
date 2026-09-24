// Firebase Functions Gen 2 (v2) trigger builders resolve project/bucket
// config from `process.env.FIREBASE_CONFIG` at module-load time. The Firebase
// CLI and Cloud Functions runtime set this automatically when deploying or
// emulating, but it must be provided manually in unit tests.
process.env.GCLOUD_PROJECT ??= 'hoverboard-test';
process.env.FIREBASE_CONFIG ??= JSON.stringify({
  projectId: 'hoverboard-test',
  storageBucket: 'hoverboard-test.appspot.com',
});
