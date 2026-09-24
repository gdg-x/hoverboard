import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveGeneratedSessions } from '../../src/db/generated-sessions';

vi.mock('firebase-admin/firestore');
vi.mock('firebase-functions/logger');

describe('db/generated-sessions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('logs an error when session data is undefined or empty', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    saveGeneratedSessions(undefined);
    expect(errorSpy).toHaveBeenCalledWith(
      'Attempting to write empty data to Firestore collection: "generatedSessions".',
    );

    saveGeneratedSessions({});
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('saves session data to generatedSessions collection', () => {
    const set = vi.fn();
    const doc = vi.fn().mockReturnValue({ set });
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const sessionsData = {
      'session-1': { title: 'Intro to AI' },
    };

    saveGeneratedSessions(sessionsData);

    expect(collection).toHaveBeenCalledWith('generatedSessions');
    expect(doc).toHaveBeenCalledWith('session-1');
    expect(set).toHaveBeenCalledWith(sessionsData['session-1']);
  });
});
