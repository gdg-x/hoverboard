import { getFirestore } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSchedule, getSchedule } from '../../src/db/schedule';

vi.mock('firebase-admin/firestore');

describe('db/schedule', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('fetches schedule ordered by date desc', async () => {
    const mockQuerySnapshot = { docs: [] };
    const get = vi.fn().mockResolvedValue(mockQuerySnapshot);
    const orderBy = vi.fn().mockReturnValue({ get });
    const collection = vi.fn().mockReturnValue({ orderBy });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const result = await fetchSchedule();

    expect(collection).toHaveBeenCalledWith('schedule');
    expect(orderBy).toHaveBeenCalledWith('date', 'desc');
    expect(get).toHaveBeenCalled();
    expect(result).toBe(mockQuerySnapshot);
  });

  it('gets unordered schedule', async () => {
    const mockQuerySnapshot = { docs: [] };
    const get = vi.fn().mockResolvedValue(mockQuerySnapshot);
    const collection = vi.fn().mockReturnValue({ get });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const result = await getSchedule();

    expect(collection).toHaveBeenCalledWith('schedule');
    expect(get).toHaveBeenCalled();
    expect(result).toBe(mockQuerySnapshot);
  });
});
