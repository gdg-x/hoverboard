import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

interface OwnedCollection {
  collectionName: string;
  valid: Record<string, unknown>;
  invalid: [string, Record<string, unknown>][];
}

// Documents keyed by the user's ID, which only that user can read and write.
describe.each<OwnedCollection>([
  {
    collectionName: 'featuredSessions',
    valid: { 'session-1': true, 'session-2': false },
    invalid: [
      [
        'more than 500 sessions',
        Object.fromEntries(Array.from({ length: 501 }, (_, i) => [`session-${i}`, true])),
      ],
    ],
  },
  {
    collectionName: 'notificationsUsers',
    valid: { tokens: { 'token-1': true } },
    invalid: [
      ['an extra field', { tokens: {}, admin: true }],
      ['a list of tokens', { tokens: ['token-1'] }],
      [
        'more than 20 tokens',
        { tokens: Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`token-${i}`, true])) },
      ],
    ],
  },
])('$collectionName rules', ({ collectionName, valid, invalid }) => {
  const ownerUid = 'owner-uid';
  const otherUid = 'other-uid';
  const ownerDocPath = `${collectionName}/${ownerUid}`;

  beforeEach(() => seed({ [ownerDocPath]: valid }));

  describe('unauthenticated', () => {
    it('denies get/create/update/delete', async () => {
      const context = anonContext();
      await expect(getDoc(doc(context.firestore(), ownerDocPath))).toDeny();
      await expect(setDoc(doc(context.firestore(), `${collectionName}/new-id`), valid)).toDeny();
      await expect(updateDoc(doc(context.firestore(), ownerDocPath), valid)).toDeny();
      await expect(deleteDoc(doc(context.firestore(), ownerDocPath))).toDeny();
    });
  });

  describe('as the owner', () => {
    it('allows get/create/update/delete on their own document', async () => {
      const context = authedContext(ownerUid);
      await expect(getDoc(doc(context.firestore(), ownerDocPath))).toAllow();
      await expect(setDoc(doc(context.firestore(), ownerDocPath), valid)).toAllow();
      await expect(updateDoc(doc(context.firestore(), ownerDocPath), valid)).toAllow();
      await expect(deleteDoc(doc(context.firestore(), ownerDocPath))).toAllow();
    });

    it.each(invalid)('denies %s', async (_case, data) => {
      const context = authedContext(ownerUid);
      await expect(setDoc(doc(context.firestore(), ownerDocPath), data)).toDeny();
    });

    it('denies listing the collection', async () => {
      const context = authedContext(ownerUid);
      await expect(getDocs(collection(context.firestore(), collectionName))).toDeny();
    });
  });

  describe('as a different authenticated user', () => {
    it("denies get/create/update/delete on someone else's document", async () => {
      const context = authedContext(otherUid);
      await expect(getDoc(doc(context.firestore(), ownerDocPath))).toDeny();
      await expect(setDoc(doc(context.firestore(), ownerDocPath), valid)).toDeny();
      await expect(updateDoc(doc(context.firestore(), ownerDocPath), valid)).toDeny();
      await expect(deleteDoc(doc(context.firestore(), ownerDocPath))).toDeny();
    });
  });
});
