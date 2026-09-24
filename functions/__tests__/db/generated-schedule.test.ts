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

  it('logs an error when schedule data is undefined or empty', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    saveGeneratedSchedule(undefined);
    expect(errorSpy).toHaveBeenCalledWith(
      'Attempting to write empty data to Firestore collection: "generatedSchedule".',
    );

    saveGeneratedSchedule({});
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('saves schedule data to generatedSchedule collection', () => {
    const set = vi.fn();
    const doc = vi.fn().mockReturnValue({ set });
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const scheduleData = {
      '2025-06-22': { date: '2025-06-22', timeslots: [] },
    };

    saveGeneratedSchedule(scheduleData);

    expect(collection).toHaveBeenCalledWith('generatedSchedule');
    expect(doc).toHaveBeenCalledWith('2025-06-22');
    expect(set).toHaveBeenCalledWith(scheduleData['2025-06-22']);
  });
});
