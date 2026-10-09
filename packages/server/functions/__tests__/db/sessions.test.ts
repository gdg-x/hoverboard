import { getFirestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSessions, fetchSessionsOn } from '../../src/db/sessions';

vi.mock('firebase-admin/firestore');

describe('db/sessions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('fetches all sessions', async () => {
    const mockQuerySnapshot = { docs: [] };
    const get = vi.fn().mockResolvedValue(mockQuerySnapshot);
    const collection = vi.fn().mockReturnValue({ get });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const result = await fetchSessions();

    expect(collection).toHaveBeenCalledWith('sessions');
    expect(get).toHaveBeenCalled();
    expect(result).toBe(mockQuerySnapshot);
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
