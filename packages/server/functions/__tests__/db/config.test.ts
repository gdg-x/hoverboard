import { getFirestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchConfig } from '../../src/db/config';

vi.mock('firebase-admin/firestore');

describe('db/config', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('fetches a config document by id', async () => {
    const mockDocSnapshot = {
      id: 'notifications',
      exists: true,
      data: () => ({ icon: '/icon.png' }),
    };
    const get = vi.fn().mockResolvedValue(mockDocSnapshot);
    const doc = vi.fn().mockReturnValue({ get });
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const result = await fetchConfig('notifications');

    expect(collection).toHaveBeenCalledWith('config');
    expect(doc).toHaveBeenCalledWith('notifications');
    expect(get).toHaveBeenCalled();
    expect(result).toBe(mockDocSnapshot);
  });
});
