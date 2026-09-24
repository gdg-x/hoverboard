import { getFirestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSpeakers } from '../../src/db/speakers';

vi.mock('firebase-admin/firestore');

describe('db/speakers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('fetches all speakers', async () => {
    const mockQuerySnapshot = { docs: [] };
    const get = vi.fn().mockResolvedValue(mockQuerySnapshot);
    const collection = vi.fn().mockReturnValue({ get });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const result = await fetchSpeakers();

    expect(collection).toHaveBeenCalledWith('speakers');
    expect(get).toHaveBeenCalled();
    expect(result).toBe(mockQuerySnapshot);
  });
});
