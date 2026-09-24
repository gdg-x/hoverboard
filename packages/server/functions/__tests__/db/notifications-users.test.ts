import { getFirestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchNotificationsUser, removeUserTokens } from '../../src/db/notifications-users';

vi.mock('firebase-admin/firestore');

describe('db/notifications-users', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('fetches a notifications user by id', async () => {
    const mockDocSnapshot = { id: 'user-1', exists: true, data: () => ({ tokens: {} }) };
    const get = vi.fn().mockResolvedValue(mockDocSnapshot);
    const doc = vi.fn().mockReturnValue({ get });
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const result = await fetchNotificationsUser('user-1');

    expect(collection).toHaveBeenCalledWith('notificationsUsers');
    expect(doc).toHaveBeenCalledWith('user-1');
    expect(get).toHaveBeenCalled();
    expect(result).toBe(mockDocSnapshot);
  });

  it('removes invalid user tokens inside a transaction', async () => {
    const mockUserDoc = {
      exists: true,
      data: () => ({ 'token-1': true, 'token-2': true }),
    };
    const transactionGet = vi.fn().mockResolvedValue(mockUserDoc);
    const transactionSet = vi.fn();
    const runTransaction = vi
      .fn()
      .mockImplementation((cb: (t: unknown) => Promise<unknown>) =>
        cb({ get: transactionGet, set: transactionSet }),
      );
    const docRef = { id: 'user-1' };
    const doc = vi.fn().mockReturnValue(docRef);
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection, runTransaction } as never);

    await removeUserTokens({ 'token-1': 'user-1' });

    expect(collection).toHaveBeenCalledWith('notificationsUsers');
    expect(doc).toHaveBeenCalledWith('user-1');
    expect(runTransaction).toHaveBeenCalled();
    expect(transactionGet).toHaveBeenCalledWith(docRef);
    expect(transactionSet).toHaveBeenCalledWith(docRef, { 'token-2': true });
  });

  it('handles non-existent user doc in removeUserTokens', async () => {
    const mockUserDoc = { exists: false };
    const transactionGet = vi.fn().mockResolvedValue(mockUserDoc);
    const transactionSet = vi.fn();
    const runTransaction = vi
      .fn()
      .mockImplementation((cb: (t: unknown) => Promise<unknown>) =>
        cb({ get: transactionGet, set: transactionSet }),
      );
    const docRef = { id: 'user-2' };
    const doc = vi.fn().mockReturnValue(docRef);
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection, runTransaction } as never);

    await removeUserTokens({ 'token-3': 'user-2' });

    expect(transactionGet).toHaveBeenCalledWith(docRef);
    expect(transactionSet).not.toHaveBeenCalled();
  });
});
