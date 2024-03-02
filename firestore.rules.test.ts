import { RulesTestContext } from '@firebase/rules-unit-testing';
import { afterEach, beforeEach, describe, it } from '@jest/globals';
import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentReference,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { setupApp, teardownApp } from './__tests__/firestore.setup';
import { expect } from './__tests__/helpers';

describe('firestore', () => {
  let testEnv: RulesTestContext;

  afterEach(async () => {
    await teardownApp();
  });

  describe('default rules', () => {
    let ref: CollectionReference;

    beforeEach(async () => {
      testEnv = await setupApp();
      ref = collection(testEnv.firestore(), 'some-nonexistent-collection');
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
        testEnv = await setupApp({ data: mockData });

        colRef = collection(testEnv.firestore(), 'sessions/1/feedback');
        docRef = doc(testEnv.firestore(), 'sessions/1/feedback', '1');
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
        console.log('beforeEach');
        testEnv = await setupApp({ userId: '2', data: mockData });

        colRef = collection(testEnv.firestore(), 'sessions/1/feedback');
        docRef = doc(testEnv.firestore(), 'sessions/1/feedback', '1');
        ownDocRef = doc(testEnv.firestore(), 'sessions/1/feedback', '2');
      });

      it('fail on other documents', () => {
        console.log('one');
        expect(getDocs(colRef)).toDeny();
        expect(addDoc(colRef, mockFeedback)).toDeny();
        expect(getDoc(docRef)).toDeny();
        expect(updateDoc(docRef, {})).toDeny();
        expect(deleteDoc(docRef)).toDeny();
      });

      it('can interact with own documents', () => {
        console.log('two.1');
        expect(getDoc(ownDocRef)).toAllow();
        console.log('two.2');
        expect(updateDoc(ownDocRef, {})).toAllow();
        console.log('two.3');
        expect(deleteDoc(ownDocRef)).toAllow();
        console.log('two.4');
      });

      it('data validation', () => {
        console.log('three.1');
        expect(updateDoc(ownDocRef, {})).toAllow();
        console.log('three.2');
        [
          { contentRating: -1 },
          { contentRating: 11 },
          { styleRating: -1 },
          { styleRating: 11 },
          { comment: null },
          { comment: 'c'.repeat(257) },
        ].forEach((data) => {
          console.log('three.3', data);
          expect(updateDoc(ownDocRef, data)).toDeny();
        });
        console.log('three.4');
      });
    });
  });
});
