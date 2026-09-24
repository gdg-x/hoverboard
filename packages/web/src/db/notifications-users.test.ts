import { doc, setDoc } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveNotificationsUsers, subscribeToNotificationsUsers } from './notifications-users';
import { db } from '../firebase';
import { subscribeToDocument } from '../utils/firestore';

vi.mock('firebase/firestore');
vi.mock('../utils/firestore');

describe('db/notifications-users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to notificationsUsers document', () => {
    const onStart = vi.fn();
    const onNext = vi.fn();
    const onError = vi.fn();

    subscribeToNotificationsUsers('user-1', onStart, onNext, onError);

    expect(subscribeToDocument).toHaveBeenCalledWith(
      'notificationsUsers/user-1',
      onStart,
      onNext,
      onError,
    );
  });

  it('saves notifications users data', async () => {
    vi.mocked(doc).mockReturnValue('doc-ref' as never);
    vi.mocked(setDoc).mockResolvedValue(undefined as never);

    await saveNotificationsUsers('user-1', { tokens: { 'token-1': true } });

    expect(doc).toHaveBeenCalledWith(db, 'notificationsUsers', 'user-1');
    expect(setDoc).toHaveBeenCalledWith('doc-ref', { tokens: { 'token-1': true } });
  });
});
