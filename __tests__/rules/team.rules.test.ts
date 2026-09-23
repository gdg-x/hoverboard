import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

const BOTH_CONTEXTS = [
  ['unauthenticated', anonContext],
  ['authenticated', () => authedContext('user-1')],
] as const;

describe('team rules', () => {
  const docPath = 'team/team-1';

  beforeEach(() => seed({ [docPath]: { name: 'Team' } }));

  describe.each(BOTH_CONTEXTS)('%s', (_label, getContext) => {
    it('allows get/list', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toAllow();
      await expect(getDocs(collection(context.firestore(), 'team'))).toAllow();
    });

    it('denies create/update/delete', async () => {
      const context = getContext();
      await expect(addDoc(collection(context.firestore(), 'team'), { name: 'New' })).toDeny();
      await expect(updateDoc(doc(context.firestore(), docPath), { name: 'Changed' })).toDeny();
      await expect(deleteDoc(doc(context.firestore(), docPath))).toDeny();
    });
  });
});

describe('team/{teamId}/members nested rule', () => {
  const docPath = 'team/team-1/members/member-1';

  beforeEach(() => seed({ [docPath]: { name: 'Member' } }));

  describe.each(BOTH_CONTEXTS)('%s', (_label, getContext) => {
    it('allows get/list', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toAllow();
      await expect(getDocs(collection(context.firestore(), 'team/team-1/members'))).toAllow();
    });

    it('denies write', async () => {
      const context = getContext();
      await expect(updateDoc(doc(context.firestore(), docPath), { name: 'Changed' })).toDeny();
    });
  });
});

describe('generic {path=**}/members catch-all rule', () => {
  // Proves the wildcard rule grants read access to a `members` subcollection
  // nested under *any* path, not only under `team`.
  const docPath = 'partners/group-1/members/member-1';

  beforeEach(() => seed({ [docPath]: { name: 'Member' } }));

  describe.each(BOTH_CONTEXTS)('%s', (_label, getContext) => {
    it('allows get/list', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toAllow();
      await expect(getDocs(collection(context.firestore(), 'partners/group-1/members'))).toAllow();
    });

    it('denies write', async () => {
      const context = getContext();
      await expect(updateDoc(doc(context.firestore(), docPath), { name: 'Changed' })).toDeny();
    });
  });
});
