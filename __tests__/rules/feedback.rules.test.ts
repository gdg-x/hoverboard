import {
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

const ownerUid = 'owner-uid';
const otherUid = 'other-uid';
const validFeedback = { contentRating: 5, styleRating: 4, comment: 'Great talk' };
const ownFeedbackPath = `sessions/session-1/feedback/${ownerUid}`;

// Both the deprecated nested rule (`sessions/{session}/feedback/{userId}`)
// and the newer generic rule (`{path=**}/feedback/{userId}`) match this
// path simultaneously and are combined with OR semantics.
describe('sessions/{session}/feedback rules', () => {
  beforeEach(() =>
    seed({
      'sessions/session-1': { title: 'Talk' },
      [ownFeedbackPath]: { ...validFeedback, userId: ownerUid },
    }),
  );

  describe('unauthenticated', () => {
    it('denies get/create/update/delete', async () => {
      const context = anonContext();
      await expect(getDoc(doc(context.firestore(), ownFeedbackPath))).toDeny();
      await expect(
        setDoc(doc(context.firestore(), ownFeedbackPath), { ...validFeedback, userId: ownerUid }),
      ).toDeny();
      await expect(deleteDoc(doc(context.firestore(), ownFeedbackPath))).toDeny();
    });
  });

  describe('as the feedback owner', () => {
    it('allows get/update/delete on their own feedback document', async () => {
      const context = authedContext(ownerUid);
      await expect(getDoc(doc(context.firestore(), ownFeedbackPath))).toAllow();
      await expect(
        updateDoc(doc(context.firestore(), ownFeedbackPath), { comment: 'Updated' }),
      ).toAllow();
      await expect(deleteDoc(doc(context.firestore(), ownFeedbackPath))).toAllow();
    });

    it('allows creating a new feedback document keyed by their own uid', async () => {
      await seed({ 'sessions/session-2': { title: 'Talk 2' } });
      const context = authedContext(ownerUid);
      const newPath = `sessions/session-2/feedback/${ownerUid}`;
      await expect(
        setDoc(doc(context.firestore(), newPath), { ...validFeedback, userId: ownerUid }),
      ).toAllow();
    });

    it.each([
      { contentRating: -1 },
      { contentRating: 6 },
      { styleRating: -1 },
      { styleRating: 6 },
      { comment: null },
      { comment: 'c'.repeat(257) },
    ])('rejects invalid feedback %o', async (overrides) => {
      const context = authedContext(ownerUid);
      await expect(
        setDoc(doc(context.firestore(), ownFeedbackPath), {
          ...validFeedback,
          userId: ownerUid,
          ...overrides,
        }),
      ).toDeny();
    });

    it('allows updating even when the stored userId field disagrees with the document id (legacy nested rule has no data-consistency check)', async () => {
      const mismatchedPath = `sessions/session-3/feedback/${ownerUid}`;
      await seed({
        'sessions/session-3': { title: 'Talk 3' },
        [mismatchedPath]: { ...validFeedback, userId: otherUid },
      });
      const context = authedContext(ownerUid);
      await expect(
        updateDoc(doc(context.firestore(), mismatchedPath), { comment: 'still works' }),
      ).toAllow();
    });
  });

  describe('as a different authenticated user', () => {
    it("denies get/update/delete on someone else's feedback", async () => {
      const context = authedContext(otherUid);
      await expect(getDoc(doc(context.firestore(), ownFeedbackPath))).toDeny();
      await expect(
        updateDoc(doc(context.firestore(), ownFeedbackPath), { comment: 'hijack' }),
      ).toDeny();
      await expect(deleteDoc(doc(context.firestore(), ownFeedbackPath))).toDeny();
    });

    it("denies creating a feedback document keyed by another user's uid", async () => {
      const context = authedContext(otherUid);
      await expect(
        setDoc(doc(context.firestore(), ownFeedbackPath), { ...validFeedback, userId: otherUid }),
      ).toDeny();
    });
  });

  describe('feedback collection group list', () => {
    it('allows listing your own feedback when the query filters by userId', async () => {
      const context = authedContext(ownerUid);
      const q = query(
        collectionGroup(context.firestore(), 'feedback'),
        where('userId', '==', ownerUid),
      );
      await expect(getDocs(q)).toAllow();
    });

    it('denies an unfiltered collection group list, even for the owner', async () => {
      const context = authedContext(ownerUid);
      await expect(getDocs(collectionGroup(context.firestore(), 'feedback'))).toDeny();
    });

    it("denies listing filtered by another user's id", async () => {
      const context = authedContext(ownerUid);
      const q = query(
        collectionGroup(context.firestore(), 'feedback'),
        where('userId', '==', otherUid),
      );
      await expect(getDocs(q)).toDeny();
    });
  });
});
