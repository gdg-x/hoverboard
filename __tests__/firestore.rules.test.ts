import { setup, teardown } from './helpers';

describe('default rules', () => {
  let db: firebase.firestore.Firestore;
  let ref: firebase.firestore.CollectionReference;

  beforeAll(async () => {
    db = await setup();

    ref = db.collection('some-nonexistent-collection');
  });

  afterAll(async () => {
    await teardown();
  });

  it('fail when reading/writing an unauthorized collection', () => {
    expect(ref.get()).toDeny();
    expect(ref.add({})).toDeny();
  });
});

describe('feedback rules', () => {
  let db: firebase.firestore.Firestore;
  let colRef: firebase.firestore.CollectionReference;
  let docRef: firebase.firestore.DocumentReference;
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

    it('fail when reading/writing an unauthorized collection', () => {
      expect(colRef.get()).toDeny();
      expect(colRef.add({})).toDeny();
      expect(docRef.get()).toDeny();
      expect(docRef.update({})).toDeny();
      expect(docRef.delete()).toDeny();
    });
  });

  describe('when authenticated', () => {
    let ownDocRef: firebase.firestore.DocumentReference;

    beforeEach(async () => {
      db = await setup({ uid: '2' }, mockData);

      colRef = db.collection('sessions/1/feedback');
      docRef = colRef.doc('1');
      ownDocRef = colRef.doc('2');
    });

    it('fail on other documents', () => {
      expect(colRef.get()).toDeny();
      expect(colRef.add(mockFeedback)).toDeny();
      expect(docRef.get()).toDeny();
      expect(docRef.update({})).toDeny();
      expect(docRef.delete()).toDeny();
    });

    it('can interact with own documents', () => {
      expect(ownDocRef.get()).toAllow();
      expect(ownDocRef.update({})).toAllow();
      expect(ownDocRef.delete()).toAllow();
    });

    it('data validation', () => {
      expect(ownDocRef.update({})).toAllow();
      [
        { contentRating: -1 },
        { contentRating: 11 },
        { styleRating: -1 },
        { styleRating: 11 },
        { comment: null },
        { comment: 'c'.repeat(257) },
      ].forEach((data) => {
        expect(ownDocRef.update(data)).toDeny();
      });
    });
  });
});
