import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentReference,
  FirebaseFirestore,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { setupApp, teardownApp } from './firestore.setup';
import './helpers';

describe('firestore', () => {
  let db: FirebaseFirestore;

  afterEach(async () => {
    await teardownApp();
  });

  describe('default rules', () => {
    let ref: CollectionReference;

    beforeEach(async () => {
      db = await setupApp();
      ref = collection(db, 'some-nonexistent-collection');
    });

    it('fail when reading/writing an unauthorized collection', () => {
      expect(getDocs(ref)).toDeny();
      expect(addDoc(ref, {})).toDeny();
    });
  });

  describe('feedback rules', () => {
    let colRef: CollectionReference;
    let docRef: DocumentReference;
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

    describe('when not authenticated', () => {
      beforeEach(async () => {
        db = await setupApp(undefined, mockData);

        colRef = collection(db, 'sessions/1/feedback');
        docRef = doc(colRef, '1');
      });

      it('fail when reading/writing an unauthorized collection', () => {
        expect(getDocs(colRef)).toDeny();
        expect(addDoc(colRef, {})).toDeny();
        expect(getDoc(docRef)).toDeny();
        expect(updateDoc(docRef, {})).toDeny();
        expect(deleteDoc(docRef)).toDeny();
      });
    });

    describe('when authenticated', () => {
      let ownDocRef: DocumentReference;

      beforeEach(async () => {
        db = await setupApp({ uid: '2' }, mockData);

        colRef = collection(db, 'sessions/1/feedback');
        docRef = doc(colRef, '1');
        ownDocRef = doc(colRef, '2');
      });

      it('fail on other documents', () => {
        expect(getDocs(colRef)).toDeny();
        expect(addDoc(colRef, mockFeedback)).toDeny();
        expect(getDoc(docRef)).toDeny();
        expect(updateDoc(docRef, {})).toDeny();
        expect(deleteDoc(docRef)).toDeny();
      });

      it('can interact with own documents', () => {
        expect(getDoc(ownDocRef)).toAllow();
        expect(updateDoc(ownDocRef, {})).toAllow();
        expect(deleteDoc(ownDocRef)).toAllow();
      });

      it('data validation', () => {
        expect(updateDoc(ownDocRef, {})).toAllow();
        [
          { contentRating: -1 },
          { contentRating: 11 },
          { styleRating: -1 },
          { styleRating: 11 },
          { comment: null },
          { comment: 'c'.repeat(257) },
        ].forEach((data) => {
          expect(updateDoc(ownDocRef, data)).toDeny();
        });
      });
    });
  });
});
