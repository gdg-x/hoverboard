import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

describe('notificationsSubscribers rules', () => {
  // This collection is intentionally open (anyone can subscribe/unsubscribe a
  // push token without auth), but `list` is always denied so nobody can
  // enumerate other people's subscription tokens.
  const docPath = 'notificationsSubscribers/token-1';

  beforeEach(() => seed({ [docPath]: { topic: 'news' } }));

  describe.each([
    ['unauthenticated', anonContext],
    ['authenticated', () => authedContext('user-1')],
  ] as const)('%s', (_label, getContext) => {
    it('allows get', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toAllow();
    });

    it('allows create', async () => {
      const context = getContext();
      await expect(
        setDoc(doc(context.firestore(), 'notificationsSubscribers/new-token'), { topic: 'x' }),
      ).toAllow();
    });

    it('allows update', async () => {
      const context = getContext();
      await expect(updateDoc(doc(context.firestore(), docPath), { topic: 'updated' })).toAllow();
    });

    it('allows delete', async () => {
      const context = getContext();
      await expect(deleteDoc(doc(context.firestore(), docPath))).toAllow();
    });

    it('denies listing the collection', async () => {
      const context = getContext();
      await expect(getDocs(collection(context.firestore(), 'notificationsSubscribers'))).toDeny();
    });
  });
});
