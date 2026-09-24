import { getFirestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  deleteNotificationSubscriber,
  fetchNotificationSubscribers,
} from '../../src/db/notifications-subscribers';

vi.mock('firebase-admin/firestore');

describe('db/notifications-subscribers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('fetches all notification subscribers', async () => {
    const mockQuerySnapshot = { docs: [{ id: 'token-1' }] };
    const get = vi.fn().mockResolvedValue(mockQuerySnapshot);
    const collection = vi.fn().mockReturnValue({ get });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const result = await fetchNotificationSubscribers();

    expect(collection).toHaveBeenCalledWith('notificationsSubscribers');
    expect(get).toHaveBeenCalled();
    expect(result).toBe(mockQuerySnapshot);
  });

  it('deletes a notification subscriber token', async () => {
    const deleteFn = vi.fn().mockResolvedValue({});
    const doc = vi.fn().mockReturnValue({ delete: deleteFn });
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    await deleteNotificationSubscriber('token-1');

    expect(collection).toHaveBeenCalledWith('notificationsSubscribers');
    expect(doc).toHaveBeenCalledWith('token-1');
    expect(deleteFn).toHaveBeenCalled();
  });
});
