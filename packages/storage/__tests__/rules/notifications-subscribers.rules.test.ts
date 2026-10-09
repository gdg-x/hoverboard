import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

describe('notificationsSubscribers rules', () => {
  // Anyone can subscribe or unsubscribe a push token without signing in. The document ID is the
  // token, which only its device knows, and `list` is denied so nobody can find other tokens.
  const docPath = 'notificationsSubscribers/token-1';
  const valid = () => ({ value: true, updatedAt: Timestamp.now() });

  beforeEach(() => seed({ [docPath]: valid() }));

  describe.each([
    ['unauthenticated', anonContext],
    ['authenticated', () => authedContext('user-1')],
  ] as const)('%s', (_label, getContext) => {
    it('allows get', async () => {
      await expect(getDoc(doc(getContext().firestore(), docPath))).toAllow();
    });

    it('allows creating and updating a valid document', async () => {
      const context = getContext();
      await expect(
        setDoc(doc(context.firestore(), 'notificationsSubscribers/new-token'), valid()),
      ).toAllow();
      await expect(updateDoc(doc(context.firestore(), docPath), valid())).toAllow();
    });

    it.each([
      ['value false', { value: false }],
      ['a string for updatedAt', { updatedAt: '2026-10-09' }],
      ['an extra field', { topic: 'news' }],
    ])('denies %s', async (_case, overrides) => {
      await expect(
        setDoc(doc(getContext().firestore(), 'notificationsSubscribers/new-token'), {
          ...valid(),
          ...overrides,
        }),
      ).toDeny();
    });

    it('allows delete', async () => {
      await expect(deleteDoc(doc(getContext().firestore(), docPath))).toAllow();
    });

    it('denies listing the collection', async () => {
      await expect(
        getDocs(collection(getContext().firestore(), 'notificationsSubscribers')),
      ).toDeny();
    });
  });
});
