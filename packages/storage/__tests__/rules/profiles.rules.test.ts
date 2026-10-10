import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

const ownerUid = 'owner-uid';
const otherUid = 'other-uid';
const picture = 'https://photos.test/ada.jpg';
const profilePath = `profiles/${ownerUid}`;
const profile = () => ({ name: 'Ada Lovelace', photoUrl: picture, updatedAt: serverTimestamp() });

const asOwner = (token: Record<string, string> = { picture }) =>
  authedContext(ownerUid, token).firestore();

describe('profiles rules', () => {
  beforeEach(() =>
    seed({
      [`profiles/${otherUid}`]: { name: 'Grace Hopper', photoUrl: '', updatedAt: new Date() },
    }),
  );

  it('lets anyone read a profile', async () => {
    await expect(getDoc(doc(anonContext().firestore(), `profiles/${otherUid}`))).toAllow();
    await expect(getDoc(doc(asOwner(), `profiles/${otherUid}`))).toAllow();
  });

  it('lets the owner create, update and delete their profile', async () => {
    await expect(setDoc(doc(asOwner(), profilePath), profile())).toAllow();
    await expect(
      updateDoc(doc(asOwner(), profilePath), { name: 'Ada King', updatedAt: serverTimestamp() }),
    ).toAllow();
    await expect(deleteDoc(doc(asOwner(), profilePath))).toAllow();
  });

  it('allows no photo, with or without a photo from the sign-in provider', async () => {
    await expect(setDoc(doc(asOwner(), profilePath), { ...profile(), photoUrl: '' })).toAllow();
    await expect(setDoc(doc(asOwner({}), profilePath), { ...profile(), photoUrl: '' })).toAllow();
  });

  it("denies a photo that isn't the sign-in provider's", async () => {
    await expect(
      setDoc(doc(asOwner(), profilePath), { ...profile(), photoUrl: 'https://tracker.test/1.gif' }),
    ).toDeny();
    await expect(setDoc(doc(asOwner({}), profilePath), profile())).toDeny();
  });

  it.each([
    ['an empty name', { name: '' }],
    ['a blank name', { name: '   ' }],
    ['a name over 100 characters', { name: 'x'.repeat(101) }],
    ['a name that is not text', { name: 42 }],
    ['an extra field', { bio: 'Hi' }],
    ['a time from the client', { updatedAt: Timestamp.fromDate(new Date('2026-01-01')) }],
  ])('denies %s', async (_description, overrides) => {
    await expect(setDoc(doc(asOwner(), profilePath), { ...profile(), ...overrides })).toDeny();
  });

  it('denies a profile without a name', async () => {
    const { name: _name, ...withoutName } = profile();
    await expect(setDoc(doc(asOwner(), profilePath), withoutName)).toDeny();
  });

  it("denies writing or deleting someone else's profile", async () => {
    const path = `profiles/${otherUid}`;
    await expect(setDoc(doc(asOwner(), path), profile())).toDeny();
    await expect(deleteDoc(doc(asOwner(), path))).toDeny();
  });

  it('denies signed-out visitors any write', async () => {
    const firestore = anonContext().firestore();
    await expect(setDoc(doc(firestore, profilePath), profile())).toDeny();
    await expect(deleteDoc(doc(firestore, `profiles/${otherUid}`))).toDeny();
  });
});
