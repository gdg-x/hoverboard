import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

describe('default deny for collections with no matching rule', () => {
  const docPath = 'someUnknownCollection/doc-1';

  beforeEach(() => seed({ [docPath]: { foo: 'bar' } }));

  describe.each([
    ['unauthenticated', anonContext],
    ['authenticated', () => authedContext('user-1')],
  ] as const)('%s', (_label, getContext) => {
    it('denies reading a single document', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toDeny();
    });

    it('denies listing the collection', async () => {
      const context = getContext();
      await expect(getDocs(collection(context.firestore(), 'someUnknownCollection'))).toDeny();
    });

    it('denies creating a document', async () => {
      const context = getContext();
      await expect(
        addDoc(collection(context.firestore(), 'someUnknownCollection'), { foo: 'baz' }),
      ).toDeny();
    });

    it('denies updating a document', async () => {
      const context = getContext();
      await expect(updateDoc(doc(context.firestore(), docPath), { foo: 'baz' })).toDeny();
    });

    it('denies deleting a document', async () => {
      const context = getContext();
      await expect(deleteDoc(doc(context.firestore(), docPath))).toDeny();
    });
  });
});

describe('config rules', () => {
  // `config/{config}` explicitly denies both read and write for everyone,
  // regardless of authentication - it is meant to be managed only via the
  // Admin SDK / emulator seeding, never through client rules.
  const docPath = 'config/site';

  beforeEach(() => seed({ [docPath]: { theme: 'dark' } }));

  describe.each([
    ['unauthenticated', anonContext],
    ['authenticated', () => authedContext('user-1')],
  ] as const)('%s', (_label, getContext) => {
    it('denies reading a single document', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toDeny();
    });

    it('denies listing the collection', async () => {
      const context = getContext();
      await expect(getDocs(collection(context.firestore(), 'config'))).toDeny();
    });

    it('denies writing a document', async () => {
      const context = getContext();
      await expect(updateDoc(doc(context.firestore(), docPath), { theme: 'light' })).toDeny();
    });
  });
});
