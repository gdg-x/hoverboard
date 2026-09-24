import { getFirestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSession, fetchSessions } from '../../src/db/sessions';

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

  it('fetches a single session by id', async () => {
    const mockDocSnapshot = { id: 'session-1', exists: true, data: () => ({ title: 'Keynote' }) };
    const get = vi.fn().mockResolvedValue(mockDocSnapshot);
    const doc = vi.fn().mockReturnValue({ get });
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const result = await fetchSession('session-1');

    expect(collection).toHaveBeenCalledWith('sessions');
    expect(doc).toHaveBeenCalledWith('session-1');
    expect(get).toHaveBeenCalled();
    expect(result).toBe(mockDocSnapshot);
  });
});
