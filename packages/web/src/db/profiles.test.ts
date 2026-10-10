import { Success } from '@abraham/remotedata';
import {
  collection,
  deleteDoc,
  doc,
  documentId,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../firebase';
import { subscribeToDocument } from '../utils/firestore';
import {
  deleteProfile,
  MAX_PROFILES,
  saveProfile,
  subscribeToOwnProfile,
  subscribeToProfiles,
} from './profiles';

vi.mock('firebase/firestore');
vi.mock('../utils/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/firestore')>()),
  subscribeToDocument: vi.fn(),
}));

const updatedAt = { toDate: () => new Date('2026-10-01T10:00:00Z') };

describe('db/profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listens to the visitor's profile, which may not exist yet", () => {
    const subscription = new Success(vi.fn());
    vi.mocked(subscribeToDocument).mockImplementation((_path, _onStart, next) => {
      next({ id: 'ada', name: 'Ada', photoUrl: '', updatedAt }, { pending: false });
      // A pending write has no server time yet.
      next({ id: 'ada', name: 'Ada King', photoUrl: '', updatedAt: null }, { pending: true });
      next(undefined, { pending: false });
      return subscription;
    });
    const onNext = vi.fn();

    expect(subscribeToOwnProfile('ada', vi.fn(), onNext, vi.fn())).toBe(subscription);

    expect(subscribeToDocument).toHaveBeenCalledWith(
      'profiles/ada',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
    expect(onNext.mock.calls).toEqual([
      [
        { id: 'ada', name: 'Ada', photoUrl: '', updatedAt: new Date('2026-10-01T10:00:00Z') },
        { pending: false },
      ],
      [{ id: 'ada', name: 'Ada King', photoUrl: '' }, { pending: true }],
      [undefined, { pending: false }],
    ]);
  });

  it('listens to the profiles of some users, up to the limit of an `in` filter', () => {
    const unsubscribe = vi.fn();
    vi.mocked(collection).mockReturnValue('profiles-ref' as never);
    vi.mocked(documentId).mockReturnValue('document-id' as never);
    vi.mocked(where).mockReturnValue('where' as never);
    vi.mocked(query).mockReturnValue('query' as never);
    const profile = {
      id: 'ada',
      data: vi.fn(() => ({ name: 'Ada', photoUrl: 'https://photos.test/ada.jpg', updatedAt })),
    };
    vi.mocked(onSnapshot).mockImplementation((_query, onNext) => {
      (onNext as unknown as (snapshot: unknown) => void)({ docs: [profile] });
      return unsubscribe;
    });
    const onNext = vi.fn();
    const ids = Array.from({ length: MAX_PROFILES + 5 }, (_, index) => `user-${index}`);

    expect(subscribeToProfiles(ids, onNext, vi.fn())).toBe(unsubscribe);

    expect(collection).toHaveBeenCalledWith(db, 'profiles');
    expect(where).toHaveBeenCalledWith('document-id', 'in', ids.slice(0, MAX_PROFILES));
    expect(profile.data).toHaveBeenCalledWith({ serverTimestamps: 'estimate' });
    expect(onNext).toHaveBeenCalledWith([
      {
        id: 'ada',
        name: 'Ada',
        photoUrl: 'https://photos.test/ada.jpg',
        updatedAt: new Date('2026-10-01T10:00:00Z'),
      },
    ]);
  });

  it("saves a profile with the server's time, and reports a rejection", async () => {
    const error = new Error('permission-denied');
    vi.mocked(doc).mockReturnValue('profile-ref' as never);
    vi.mocked(serverTimestamp).mockReturnValue('server-time' as never);
    vi.mocked(setDoc).mockRejectedValue(error);
    const onRejected = vi.fn();

    saveProfile('ada', { name: 'Ada', photoUrl: '' }, onRejected);

    expect(doc).toHaveBeenCalledWith(db, 'profiles', 'ada');
    expect(setDoc).toHaveBeenCalledWith('profile-ref', {
      name: 'Ada',
      photoUrl: '',
      updatedAt: 'server-time',
    });
    await vi.waitFor(() => expect(onRejected).toHaveBeenCalledWith(error));
  });

  it("deletes the visitor's reactions, then their profile", () => {
    vi.mocked(doc).mockImplementation((...path: unknown[]) => path.slice(1).join('/') as never);
    vi.mocked(deleteDoc).mockResolvedValue();

    deleteProfile('ada', ['101', '102'], vi.fn());

    expect(vi.mocked(deleteDoc).mock.calls).toEqual([
      ['sessions/101/reactions/ada'],
      ['sessions/102/reactions/ada'],
      ['profiles/ada'],
    ]);
  });
});
