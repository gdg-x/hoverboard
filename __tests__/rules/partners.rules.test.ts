import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

const BOTH_CONTEXTS = [
  ['unauthenticated', anonContext],
  ['authenticated', () => authedContext('user-1')],
] as const;

describe('partners rules', () => {
  const docPath = 'partners/group-1';

  beforeEach(() => seed({ [docPath]: { name: 'Partner' } }));

  describe.each(BOTH_CONTEXTS)('%s', (_label, getContext) => {
    it('allows get/list', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toAllow();
      await expect(getDocs(collection(context.firestore(), 'partners'))).toAllow();
    });

    it('denies create/update/delete', async () => {
      const context = getContext();
      await expect(addDoc(collection(context.firestore(), 'partners'), { name: 'New' })).toDeny();
      await expect(updateDoc(doc(context.firestore(), docPath), { name: 'Changed' })).toDeny();
      await expect(deleteDoc(doc(context.firestore(), docPath))).toDeny();
    });
  });
});

describe('partners/{groupId}/items nested rule', () => {
  const docPath = 'partners/group-1/items/item-1';

  beforeEach(() => seed({ [docPath]: { order: 1 } }));

  describe.each(BOTH_CONTEXTS)('%s', (_label, getContext) => {
    it('allows get/list', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toAllow();
      await expect(getDocs(collection(context.firestore(), 'partners/group-1/items'))).toAllow();
    });

    it('denies write', async () => {
      const context = getContext();
      await expect(updateDoc(doc(context.firestore(), docPath), { order: 2 })).toDeny();
    });
  });
});

describe('generic {path=**}/items catch-all rule', () => {
  // Proves the wildcard rule grants read access to an `items` subcollection
  // nested under *any* path, not only under `partners`.
  const docPath = 'team/team-1/items/item-1';

  beforeEach(() => seed({ [docPath]: { order: 1 } }));

  describe.each(BOTH_CONTEXTS)('%s', (_label, getContext) => {
    it('allows get/list', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toAllow();
      await expect(getDocs(collection(context.firestore(), 'team/team-1/items'))).toAllow();
    });

    it('denies write', async () => {
      const context = getContext();
      await expect(updateDoc(doc(context.firestore(), docPath), { order: 2 })).toDeny();
    });
  });
});
