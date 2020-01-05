const { setup, teardown } = require('./helpers');

describe('Default rules', () => {
  let db;
  let ref;

  beforeAll(async () => {
    db = await setup();

    ref = db.collection('some-nonexistent-collection');
  });

  afterAll(async () => {
    await teardown();
  });

  test('fail when reading/writing an unauthorized collection', async () => {
    await expect(ref.get()).toDeny();
    await expect(ref.add({})).toDeny();
  });
});

describe('Feedback rules', () => {
  let db;
  let colRef;
  let docRef;
  const mockFeedback = {
    contentRating: 5,
    styleRating: 5,
    comment: '',
  };
  const mockData = {
    'sessions/1': {
      title: 'Awesome Stuff',
    },
    'sessions/1/feedback/1': mockFeedback,
    'sessions/1/feedback/2': mockFeedback,
  };

  afterAll(async () => {
    await teardown();
  });

  describe('when not authenticated', () => {
    beforeEach(async () => {
      db = await setup(undefined, mockData);

      colRef = db.collection('sessions/1/feedback');
      docRef = colRef.doc('1');
    });

    test('fail when reading/writing an unauthorized collection', async () => {
      await expect(colRef.get()).toDeny();
      await expect(colRef.add({})).toDeny();

      await expect(docRef.get()).toDeny();
      await expect(docRef.update({})).toDeny();
      await expect(docRef.delete()).toDeny();
    });
  });

  describe('when authenticated', () => {
    let ownDocRef;

    beforeEach(async () => {
      db = await setup({ uid: '2' }, mockData);

      colRef = db.collection('sessions/1/feedback');
      docRef = colRef.doc('1');
      ownDocRef = colRef.doc('2');
    });

    test('fail on other documents', async () => {
      await expect(colRef.get()).toDeny();
      await expect(colRef.add(mockFeedback)).toDeny();
      await expect(docRef.get()).toDeny();
      await expect(docRef.update({})).toDeny();
      await expect(docRef.delete()).toDeny();
    });

    test('can interact with own documents', async () => {
      await expect(ownDocRef.get()).toAllow();
      await expect(ownDocRef.update({})).toAllow();
      await expect(ownDocRef.delete()).toAllow();
    });

    test('data validation', async () => {
      await expect(ownDocRef.update({})).toAllow();
      [
        { contentRating: -1 },
        { contentRating: 11 },
        { styleRating: -1 },
        { styleRating: 11 },
        { comment: null },
        { comment: 'c'.repeat(257) },
      ].forEach(async data => {
        await expect(ownDocRef.update(data)).toDeny();
      });
    });
  });
});
