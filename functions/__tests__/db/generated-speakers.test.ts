import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveGeneratedSpeakers } from '../../src/db/generated-speakers';

vi.mock('firebase-admin/firestore');
vi.mock('firebase-functions/logger');

describe('db/generated-speakers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('logs an error when speaker data is undefined or empty', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    saveGeneratedSpeakers(undefined);
    expect(errorSpy).toHaveBeenCalledWith(
      'Attempting to write empty data to Firestore collection: "generatedSpeakers".',
    );

    saveGeneratedSpeakers({});
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('saves speaker data to generatedSpeakers collection', () => {
    const set = vi.fn();
    const doc = vi.fn().mockReturnValue({ set });
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const speakersData = {
      'speaker-1': { name: 'Ada Lovelace' },
    };

    saveGeneratedSpeakers(speakersData);

    expect(collection).toHaveBeenCalledWith('generatedSpeakers');
    expect(doc).toHaveBeenCalledWith('speaker-1');
    expect(set).toHaveBeenCalledWith(speakersData['speaker-1']);
  });
});
