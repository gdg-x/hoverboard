import { afterEach, describe, expect, it, vi } from 'vitest';
import { getData, saveData } from './utils.js';
import { runFirestoreCopy } from './index.js';

vi.mock('./utils.js', () => ({
  getData: vi.fn(),
  saveData: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('runFirestoreCopy', () => {
  it('reads from the source and writes the result to the destination', async () => {
    vi.mocked(getData).mockResolvedValue({ name: 'Yonatan' });

    await runFirestoreCopy('speakers/yonatan_levin', 'backup/yonatan_levin.json');

    expect(getData).toHaveBeenCalledWith('speakers/yonatan_levin');
    expect(saveData).toHaveBeenCalledWith({ name: 'Yonatan' }, 'backup/yonatan_levin.json');
  });

  it('propagates errors from the source read without writing', async () => {
    vi.mocked(getData).mockRejectedValue(new Error('boom'));

    await expect(runFirestoreCopy('missing', 'out.json')).rejects.toThrow('boom');

    expect(saveData).not.toHaveBeenCalled();
  });
});
