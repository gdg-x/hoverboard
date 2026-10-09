import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

// Forms anyone can send: `create` only, with validation, and nobody can read them back.
describe.each([
  {
    collectionName: 'subscribers',
    valid: { email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' },
    nameFields: ['firstName', 'lastName'],
  },
  {
    collectionName: 'potentialPartners',
    valid: { email: 'ada@example.com', fullName: 'Ada Lovelace', companyName: 'Engines' },
    nameFields: ['fullName', 'companyName'],
  },
])('$collectionName rules', ({ collectionName, valid, nameFields }) => {
  const docPath = `${collectionName}/lead-1`;

  beforeEach(() => seed({ [docPath]: valid }));

  describe.each([
    ['unauthenticated', anonContext],
    ['authenticated', () => authedContext('user-1')],
  ] as const)('%s', (_label, getContext) => {
    const leads = () => collection(getContext().firestore(), collectionName);

    it('allows creating a valid document', async () => {
      await expect(addDoc(leads(), valid)).toAllow();
    });

    it('allows empty names, which the form sends when they are left out', async () => {
      await expect(
        addDoc(leads(), { ...valid, ...Object.fromEntries(nameFields.map((f) => [f, ''])) }),
      ).toAllow();
    });

    it.each([
      ['an email without @', { email: 'ada.example.com' }],
      ['an email with a space', { email: 'ada lovelace@example.com' }],
      ['an email over 254 characters', { email: `${'a'.repeat(250)}@example.com` }],
      ['a number for the email', { email: 42 }],
      ['an extra field', { admin: true }],
    ])('denies %s', async (_case, overrides) => {
      await expect(addDoc(leads(), { ...valid, ...overrides })).toDeny();
    });

    it.each(nameFields)('denies a missing or oversized %s', async (field) => {
      const { [field as keyof typeof valid]: _omitted, ...missing } = valid;
      await expect(addDoc(leads(), missing)).toDeny();
      await expect(addDoc(leads(), { ...valid, [field]: 'x'.repeat(101) })).toDeny();
    });

    it('denies reading a document', async () => {
      await expect(getDoc(doc(getContext().firestore(), docPath))).toDeny();
    });

    it('denies listing the collection', async () => {
      await expect(getDocs(leads())).toDeny();
    });

    it('denies overwriting, updating or deleting a document', async () => {
      const ref = doc(getContext().firestore(), docPath);
      await expect(setDoc(ref, valid)).toDeny();
      await expect(updateDoc(ref, { email: 'eve@example.com' })).toDeny();
      await expect(deleteDoc(ref)).toDeny();
    });
  });
});
