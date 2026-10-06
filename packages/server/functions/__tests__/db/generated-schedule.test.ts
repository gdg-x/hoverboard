import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveGeneratedSchedule } from '../../src/db/generated-schedule';

vi.mock('firebase-admin/firestore');
vi.mock('firebase-functions/logger');

describe('db/generated-schedule', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('logs an error when schedule data is undefined or empty', async () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    await saveGeneratedSchedule(undefined);
    expect(errorSpy).toHaveBeenCalledWith(
      'Attempting to write empty data to Firestore collection: "generatedSchedule".',
    );

    await saveGeneratedSchedule({});
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('saves schedule data to generatedSchedule collection', async () => {
    const set = vi.fn();
    const doc = vi.fn().mockReturnValue({ set });
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const scheduleData = {
      '2025-06-22': { date: '2025-06-22', timeslots: [] },
    };

    await saveGeneratedSchedule(scheduleData);

    expect(collection).toHaveBeenCalledWith('generatedSchedule');
    expect(doc).toHaveBeenCalledWith('2025-06-22');
    expect(set).toHaveBeenCalledWith(scheduleData['2025-06-22']);
  });

  it('does not resolve until every write has completed', async () => {
    let finishWrite!: () => void;
    const set = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        finishWrite = resolve;
      }),
    );
    const doc = vi.fn().mockReturnValue({ set });
    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockReturnValue({ doc }),
    } as never);
    const settled = vi.fn();

    const saving = saveGeneratedSchedule({ '2025-06-22': { timeslots: [] } }).then(settled);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();

    finishWrite();
    await saving;
    expect(settled).toHaveBeenCalled();
  });

  it('rejects when a write fails', async () => {
    const set = vi.fn().mockRejectedValue(new Error('write failed'));
    const doc = vi.fn().mockReturnValue({ set });
    vi.mocked(getFirestore).mockReturnValue({
      collection: vi.fn().mockReturnValue({ doc }),
    } as never);

    await expect(saveGeneratedSchedule({ '2025-06-22': {} })).rejects.toThrow('write failed');
  });
});
