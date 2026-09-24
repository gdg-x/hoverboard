import { getFirestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchFeaturedSessions } from '../../src/db/featured-sessions';

vi.mock('firebase-admin/firestore');

describe('db/featured-sessions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('fetches all featured sessions', async () => {
    const mockQuerySnapshot = { docs: [] };
    const get = vi.fn().mockResolvedValue(mockQuerySnapshot);
    const collection = vi.fn().mockReturnValue({ get });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const result = await fetchFeaturedSessions();

    expect(collection).toHaveBeenCalledWith('featuredSessions');
    expect(get).toHaveBeenCalled();
    expect(result).toBe(mockQuerySnapshot);
  });
});
