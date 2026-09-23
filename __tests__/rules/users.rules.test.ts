import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

describe('users rules', () => {
  const ownerUid = 'owner-uid';
  const otherUid = 'other-uid';
  const docPath = `users/${ownerUid}`;

  beforeEach(() => seed({ [docPath]: { name: 'Existing' } }));

  describe('unauthenticated', () => {
    it('denies get/create/update/delete/list', async () => {
      const context = anonContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toDeny();
      await expect(setDoc(doc(context.firestore(), 'users/new-uid'), { name: 'New' })).toDeny();
      await expect(updateDoc(doc(context.firestore(), docPath), { name: 'Changed' })).toDeny();
      await expect(deleteDoc(doc(context.firestore(), docPath))).toDeny();
      await expect(getDocs(collection(context.firestore(), 'users'))).toDeny();
    });
  });

  describe('as the account owner', () => {
    it('allows get and update on their own document', async () => {
      const context = authedContext(ownerUid);
      await expect(getDoc(doc(context.firestore(), docPath))).toAllow();
      await expect(updateDoc(doc(context.firestore(), docPath), { name: 'Changed' })).toAllow();
    });

    it('denies create, even for a new document with their own id', async () => {
      const context = authedContext(ownerUid);
      await expect(
        setDoc(doc(context.firestore(), `users/${ownerUid}-new`), { name: 'New' }),
      ).toDeny();
    });

    it('denies delete', async () => {
      const context = authedContext(ownerUid);
      await expect(deleteDoc(doc(context.firestore(), docPath))).toDeny();
    });

    it('denies listing the collection', async () => {
      const context = authedContext(ownerUid);
      await expect(getDocs(collection(context.firestore(), 'users'))).toDeny();
    });
  });

  describe('as a different authenticated user', () => {
    it("denies get and update on someone else's document", async () => {
      const context = authedContext(otherUid);
      await expect(getDoc(doc(context.firestore(), docPath))).toDeny();
      await expect(updateDoc(doc(context.firestore(), docPath), { name: 'Hijacked' })).toDeny();
    });
  });
});
