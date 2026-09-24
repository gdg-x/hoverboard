import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

// Every one of these collections shares the exact same rule shape in
// firestore.rules: `get`/`list` are open to everyone, and every write
// operation is unconditionally denied (`allow write: if false;`).
const PUBLIC_READ_ONLY_COLLECTIONS = [
  'blog',
  'gallery',
  'previousSpeakers',
  'schedule',
  'generatedSchedule',
  'speakers',
  'generatedSpeakers',
  'tickets',
  'videos',
  'sessions',
  'generatedSessions',
];

describe.each(PUBLIC_READ_ONLY_COLLECTIONS)('%s rules', (collectionName) => {
  const docPath = `${collectionName}/doc-1`;

  beforeEach(() => seed({ [docPath]: { title: 'Existing' } }));

  describe.each([
    ['unauthenticated', anonContext],
    ['authenticated', () => authedContext('user-1')],
  ] as const)('%s', (_label, getContext) => {
    it('allows reading a single document', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toAllow();
    });

    it('allows listing the collection', async () => {
      const context = getContext();
      await expect(getDocs(collection(context.firestore(), collectionName))).toAllow();
    });

    it('denies creating a document', async () => {
      const context = getContext();
      await expect(
        addDoc(collection(context.firestore(), collectionName), { title: 'New' }),
      ).toDeny();
    });

    it('denies updating a document', async () => {
      const context = getContext();
      await expect(updateDoc(doc(context.firestore(), docPath), { title: 'Changed' })).toDeny();
    });

    it('denies deleting a document', async () => {
      const context = getContext();
      await expect(deleteDoc(doc(context.firestore(), docPath))).toDeny();
    });
  });
});
