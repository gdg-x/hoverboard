import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

// `potentialPartners/{partnerId}` and `subscribers/{subscriberId}` share the
// same "open lead capture" shape: anyone can create/update any document
// (there's no ownership check), `get` is open, but `list` and `delete` are
// always denied.
const LEAD_CAPTURE_COLLECTIONS = ['potentialPartners', 'subscribers'];

describe.each(LEAD_CAPTURE_COLLECTIONS)('%s rules', (collectionName) => {
  const docPath = `${collectionName}/lead-1`;

  beforeEach(() => seed({ [docPath]: { email: 'lead@example.com' } }));

  describe.each([
    ['unauthenticated', anonContext],
    ['authenticated', () => authedContext('user-1')],
  ] as const)('%s', (_label, getContext) => {
    it('allows get', async () => {
      const context = getContext();
      await expect(getDoc(doc(context.firestore(), docPath))).toAllow();
    });

    it('denies listing the collection', async () => {
      const context = getContext();
      await expect(getDocs(collection(context.firestore(), collectionName))).toDeny();
    });

    it('allows creating a new document (open lead capture, no ownership check)', async () => {
      const context = getContext();
      await expect(
        setDoc(doc(context.firestore(), `${collectionName}/new-lead`), {
          email: 'new@example.com',
        }),
      ).toAllow();
    });

    it('allows updating any existing document', async () => {
      const context = getContext();
      await expect(
        updateDoc(doc(context.firestore(), docPath), { email: 'updated@example.com' }),
      ).toAllow();
    });

    it('denies deleting a document', async () => {
      const context = getContext();
      await expect(deleteDoc(doc(context.firestore(), docPath))).toDeny();
    });
  });
});
