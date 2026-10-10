import { deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  removeNotificationsSubscriber,
  saveNotificationsSubscriber,
  subscribeToNotificationsSubscribers,
} from './notifications-subscribers';
import { db } from '../firebase';
import { subscribeToDocument } from '../utils/firestore';

vi.mock('firebase/firestore');
vi.mock('../utils/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/firestore')>()),
  subscribeToDocument: vi.fn(),
}));

describe('db/notifications-subscribers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to notificationsSubscribers document', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToNotificationsSubscribers('token-1', onStart, onNext, onError);

    expect(subscribeToDocument).toHaveBeenCalledWith(
      'notificationsSubscribers/token-1',
      onStart,
      onNext,
      onError,
    );
  });

  it('saves subscriber token with timestamp', () => {
    const now = { seconds: 123 } as never;
    vi.spyOn(Timestamp, 'now').mockReturnValue(now);
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    saveNotificationsSubscriber('token-1', vi.fn());

    expect(doc).toHaveBeenCalledWith(db, 'notificationsSubscribers', 'token-1');
    expect(setDoc).toHaveBeenCalledWith('doc-ref', {
      value: true,
      updatedAt: now,
    });
  });

  it('removes subscriber token', () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(deleteDoc).mockResolvedValue(undefined as never);

    removeNotificationsSubscriber('token-1', vi.fn());

    expect(doc).toHaveBeenCalledWith(db, 'notificationsSubscribers', 'token-1');
    expect(deleteDoc).toHaveBeenCalledWith('doc-ref');
  });
});
