import { getFirestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSessionsOn } from '../../src/db/sessions';

vi.mock('firebase-admin/firestore');

describe('db/sessions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('fetches the sessions on a day', async () => {
    const mockQuerySnapshot = { docs: [] };
    const get = vi.fn().mockResolvedValue(mockQuerySnapshot);
    const where = vi.fn().mockReturnValue({ get });
    const collection = vi.fn().mockReturnValue({ where });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const result = await fetchSessionsOn('2025-06-22');

    expect(collection).toHaveBeenCalledWith('sessions');
    expect(where).toHaveBeenCalledWith('day', '==', '2025-06-22');
    expect(result).toBe(mockQuerySnapshot);
  });
});
