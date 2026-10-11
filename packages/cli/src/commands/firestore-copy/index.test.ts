import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmChange } from '../../lib/prompt.js';
import { setTarget } from '../../lib/target.js';
import { getData, saveData } from './utils.js';
import { runFirestoreCopy } from './index.js';

vi.mock('./utils.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./utils.js')>()),
  getData: vi.fn(),
  saveData: vi.fn(),
}));
vi.mock('../../lib/firestore.js', () => ({ firestore: {} }));
vi.mock('../../lib/prompt.js', () => ({ confirmChange: vi.fn() }));
vi.mock('../../utils/firebase-project.js', () => ({ resolveFirebaseProjectId: () => 'fest-2027' }));

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  setTarget('emulator');
});

describe('runFirestoreCopy', () => {
  it('reads from the source and writes the result to the destination', async () => {
    vi.mocked(getData).mockResolvedValue({ name: 'Yonatan' });

    expect(await runFirestoreCopy('speakers/yonatan_levin', 'backup/yonatan_levin.json')).toEqual({
      ok: true,
      documents: 1,
      dryRun: false,
    });

    expect(getData).toHaveBeenCalledWith('speakers/yonatan_levin');
    expect(saveData).toHaveBeenCalledWith({ name: 'Yonatan' }, 'backup/yonatan_levin.json', {
      dryRun: false,
    });
  });

  it('propagates errors from the source read without writing', async () => {
    vi.mocked(getData).mockRejectedValue(new Error('boom'));

    await expect(runFirestoreCopy('missing', 'out.json')).rejects.toThrow('boom');

    expect(saveData).not.toHaveBeenCalled();
  });

  it('asks before writing to production, with the number of documents', async () => {
    setTarget('production');
    vi.mocked(getData).mockResolvedValue({ ada: { name: 'Ada' }, grace: { name: 'Grace' } });
    vi.mocked(confirmChange).mockResolvedValue(false);

    expect(await runFirestoreCopy('speakers.json', 'speakers')).toBe(false);

    expect(confirmChange).toHaveBeenCalledWith(
      'Write 2 documents to speakers in fest-2027? Documents with the same IDs are replaced.',
      false,
    );
    expect(saveData).not.toHaveBeenCalled();
  });

  it('reads production into a file without asking', async () => {
    setTarget('production');
    vi.mocked(getData).mockResolvedValue({ ada: { name: 'Ada' } });

    await runFirestoreCopy('speakers', 'speakers.json');

    expect(confirmChange).not.toHaveBeenCalled();
    expect(saveData).toHaveBeenCalled();
  });

  it('checks the data without asking or writing with --dry-run', async () => {
    setTarget('production');
    vi.mocked(getData).mockResolvedValue({ name: 'Ada' });

    expect(await runFirestoreCopy('ada.json', 'speakers/ada', { dryRun: true })).toEqual({
      ok: true,
      documents: 1,
      dryRun: true,
    });

    expect(confirmChange).not.toHaveBeenCalled();
    expect(saveData).toHaveBeenCalledWith({ name: 'Ada' }, 'speakers/ada', { dryRun: true });
  });
});
