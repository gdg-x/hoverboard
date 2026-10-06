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

  it('logs an error when session data is undefined or empty', async () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

    await saveGeneratedSessions(undefined);
    expect(errorSpy).toHaveBeenCalledWith(
      'Attempting to write empty data to Firestore collection: "generatedSessions".',
    );

    await saveGeneratedSessions({});
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it('saves session data to generatedSessions collection', async () => {
    const set = vi.fn();
    const doc = vi.fn().mockReturnValue({ set });
    const collection = vi.fn().mockReturnValue({ doc });
    vi.mocked(getFirestore).mockReturnValue({ collection } as never);

    const sessionsData = {
      'session-1': { title: 'Intro to AI' },
    };

    await saveGeneratedSessions(sessionsData);

    expect(collection).toHaveBeenCalledWith('generatedSessions');
    expect(doc).toHaveBeenCalledWith('session-1');
    expect(set).toHaveBeenCalledWith(sessionsData['session-1']);
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

    const saving = saveGeneratedSessions({ 'session-1': { title: 'Intro to AI' } }).then(settled);
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

    await expect(saveGeneratedSessions({ 'session-1': {} })).rejects.toThrow('write failed');
  });
});
