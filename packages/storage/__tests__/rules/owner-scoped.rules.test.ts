import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

// `featuredSessions/{userId}` and `notificationsUsers/{userId}` share the
// exact same rule: `allow read, write: if request.auth.uid == userId;`
const OWNER_SCOPED_COLLECTIONS = ['featuredSessions', 'notificationsUsers'];

describe.each(OWNER_SCOPED_COLLECTIONS)('%s rules', (collectionName) => {
  const ownerUid = 'owner-uid';
  const otherUid = 'other-uid';
  const ownerDocPath = `${collectionName}/${ownerUid}`;

  beforeEach(() => seed({ [ownerDocPath]: { value: 'existing' } }));

  describe('unauthenticated', () => {
    it('denies get/create/update/delete', async () => {
      const context = anonContext();
      await expect(getDoc(doc(context.firestore(), ownerDocPath))).toDeny();
      await expect(
        setDoc(doc(context.firestore(), `${collectionName}/new-id`), { value: 'x' }),
      ).toDeny();
      await expect(updateDoc(doc(context.firestore(), ownerDocPath), { value: 'x' })).toDeny();
      await expect(deleteDoc(doc(context.firestore(), ownerDocPath))).toDeny();
    });
  });

  describe('as the owner', () => {
    it('allows get/create/update/delete on their own document', async () => {
      const context = authedContext(ownerUid);
      await expect(getDoc(doc(context.firestore(), ownerDocPath))).toAllow();
      await expect(setDoc(doc(context.firestore(), ownerDocPath), { value: 'updated' })).toAllow();
      await expect(
        updateDoc(doc(context.firestore(), ownerDocPath), { value: 'updated-again' }),
      ).toAllow();
      await expect(deleteDoc(doc(context.firestore(), ownerDocPath))).toAllow();
    });

    it('denies listing the collection, since the rule cannot verify an unfiltered query', async () => {
      const context = authedContext(ownerUid);
      await expect(getDocs(collection(context.firestore(), collectionName))).toDeny();
    });
  });

  describe('as a different authenticated user', () => {
    it("denies get/update/delete on someone else's document", async () => {
      const context = authedContext(otherUid);
      await expect(getDoc(doc(context.firestore(), ownerDocPath))).toDeny();
      await expect(updateDoc(doc(context.firestore(), ownerDocPath), { value: 'hijack' })).toDeny();
      await expect(deleteDoc(doc(context.firestore(), ownerDocPath))).toDeny();
    });

    it('allows create/update/delete on their own document (rule is per-document, not collection-wide)', async () => {
      const context = authedContext(otherUid);
      const otherDocPath = `${collectionName}/${otherUid}`;
      await expect(setDoc(doc(context.firestore(), otherDocPath), { value: 'mine' })).toAllow();
      await expect(
        updateDoc(doc(context.firestore(), otherDocPath), { value: 'mine-again' }),
      ).toAllow();
      await expect(deleteDoc(doc(context.firestore(), otherDocPath))).toAllow();
    });
  });
});
