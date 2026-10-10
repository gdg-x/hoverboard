import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';
import { expect } from '../helpers';
import { anonContext, authedContext, seed } from './setup';

const ownerUid = 'owner-uid';
const otherUid = 'other-uid';
const day = (daysFromToday: number) =>
  new Date(Date.now() + daysFromToday * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const path = (session: string, uid = ownerUid) => `sessions/${session}/reactions/${uid}`;
const reaction = (reactions: unknown = ['applause'], userId = ownerUid) => ({
  reactions,
  userId,
  updatedAt: serverTimestamp(),
});

const asOwner = () => authedContext(ownerUid).firestore();

describe('sessions/{session}/reactions rules', () => {
  beforeEach(() =>
    seed({
      'sessions/unscheduled': { title: 'Talk' },
      'sessions/upcoming': { title: 'Talk', day: day(30) },
      'sessions/last-week': { title: 'Talk', day: day(-7) },
      'sessions/past': { title: 'Talk', day: '2020-01-01' },
      [`profiles/${ownerUid}`]: { name: 'Ada Lovelace', photoUrl: '' },
      [`profiles/${otherUid}`]: { name: 'Grace Hopper', photoUrl: '' },
      [path('unscheduled', otherUid)]: { reactions: ['love'], userId: otherUid },
      [path('past')]: { reactions: ['applause', 'love'], userId: ownerUid },
    }),
  );

  it('lets anyone read reactions', async () => {
    const firestore = anonContext().firestore();
    await expect(getDoc(doc(firestore, path('unscheduled', otherUid)))).toAllow();
    await expect(getDocs(collection(firestore, 'sessions/unscheduled/reactions'))).toAllow();
  });

  it('lets the owner add, change and remove their reactions', async () => {
    await expect(setDoc(doc(asOwner(), path('unscheduled')), reaction())).toAllow();
    await expect(
      updateDoc(doc(asOwner(), path('unscheduled')), {
        reactions: ['applause', 'funny'],
        updatedAt: serverTimestamp(),
      }),
    ).toAllow();
    await expect(deleteDoc(doc(asOwner(), path('unscheduled')))).toAllow();
  });

  it('allows every reaction at once', async () => {
    await expect(
      setDoc(
        doc(asOwner(), path('unscheduled')),
        reaction(['applause', 'love', 'insightful', 'mind-blown', 'funny']),
      ),
    ).toAllow();
  });

  it('denies a visitor without a profile', async () => {
    const firestore = authedContext('no-profile').firestore();
    await expect(
      setDoc(doc(firestore, path('unscheduled', 'no-profile')), reaction(['love'], 'no-profile')),
    ).toDeny();
  });

  it('denies a session that does not exist', async () => {
    await expect(setDoc(doc(asOwner(), path('missing')), reaction())).toDeny();
  });

  it.each([
    ['no reactions', reaction([])],
    ['an unknown reaction', reaction(['meh'])],
    ['a repeated reaction', reaction(['love', 'love'])],
    ['reactions that are not a list', reaction('love')],
    ["another user's ID", reaction(['love'], otherUid)],
    ['an extra field', { ...reaction(), name: 'Ada' }],
    ['a time from the client', { ...reaction(), updatedAt: Timestamp.fromDate(new Date()) }],
  ])('denies %s', async (_description, data) => {
    await expect(setDoc(doc(asOwner(), path('unscheduled')), data)).toDeny();
  });

  it('denies reactions without a time', async () => {
    const { updatedAt: _updatedAt, ...withoutTime } = reaction();
    await expect(setDoc(doc(asOwner(), path('unscheduled')), withoutTime)).toDeny();
  });

  it("denies writing or deleting someone else's reactions", async () => {
    await expect(
      setDoc(doc(asOwner(), path('unscheduled', otherUid)), reaction(['love'], otherUid)),
    ).toDeny();
    await expect(deleteDoc(doc(asOwner(), path('unscheduled', otherUid)))).toDeny();
  });

  it('denies signed-out visitors any write', async () => {
    const firestore = anonContext().firestore();
    await expect(setDoc(doc(firestore, path('unscheduled')), reaction())).toDeny();
    await expect(deleteDoc(doc(firestore, path('unscheduled', otherUid)))).toDeny();
  });

  describe('when visitors can react', () => {
    it('allows reactions before a session and up to a week after it', async () => {
      await expect(setDoc(doc(asOwner(), path('upcoming')), reaction())).toAllow();
      await expect(setDoc(doc(asOwner(), path('last-week')), reaction())).toAllow();
    });

    it('denies new reactions more than a week after a session', async () => {
      await expect(setDoc(doc(asOwner(), path('past')), reaction(['funny']))).toDeny();
      const firestore = authedContext(otherUid).firestore();
      await expect(
        setDoc(doc(firestore, path('past', otherUid)), reaction(['love'], otherUid)),
      ).toDeny();
    });

    it('still lets the owner take reactions away, or delete them', async () => {
      await expect(
        updateDoc(doc(asOwner(), path('past')), {
          reactions: ['love'],
          updatedAt: serverTimestamp(),
        }),
      ).toAllow();
      await expect(deleteDoc(doc(asOwner(), path('past')))).toAllow();
    });
  });

  describe('collection group list', () => {
    it('lets visitors list their own reactions in every session', async () => {
      const q = query(collectionGroup(asOwner(), 'reactions'), where('userId', '==', ownerUid));
      await expect(getDocs(q)).toAllow();
    });

    it("denies listing everyone's, or someone else's", async () => {
      await expect(getDocs(collectionGroup(asOwner(), 'reactions'))).toDeny();
      await expect(
        getDocs(query(collectionGroup(asOwner(), 'reactions'), where('userId', '==', otherUid))),
      ).toDeny();
    });

    it('denies listing for signed-out visitors', async () => {
      const q = query(
        collectionGroup(anonContext().firestore(), 'reactions'),
        where('userId', '==', ownerUid),
      );
      await expect(getDocs(q)).toDeny();
    });
  });

  it('lets a visitor delete every reaction they listed, closed sessions too, then their profile', async () => {
    const firestore = asOwner();
    await setDoc(doc(firestore, path('upcoming')), reaction(['love']));
    const own = query(collectionGroup(firestore, 'reactions'), where('userId', '==', ownerUid));

    const listed = await getDocs(own);
    expect(listed.docs.map(({ ref }) => ref.path).sort()).toEqual([path('past'), path('upcoming')]);
    for (const { ref } of listed.docs) await expect(deleteDoc(ref)).toAllow();
    await expect(deleteDoc(doc(firestore, `profiles/${ownerUid}`))).toAllow();

    expect((await getDocs(own)).empty).toBe(true);
    expect((await getDoc(doc(firestore, path('unscheduled', otherUid)))).exists()).toBe(true);
  });
});
