import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getData, saveData } from './utils.js';

const { collectionMock, docMock, getMock, setMock, batchMock, commitMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  const setMock = vi.fn();
  const commitMock = vi.fn().mockResolvedValue(undefined);
  const docMock = vi.fn(() => ({ get: getMock, set: setMock }));
  const collectionMock = vi.fn(() => ({ doc: docMock, get: getMock }));
  const batchMock = vi.fn(() => ({ set: setMock, commit: commitMock }));
  return { collectionMock, docMock, getMock, setMock, batchMock, commitMock };
});

vi.mock('../../lib/firestore.js', () => ({
  firestore: { collection: collectionMock, batch: batchMock },
}));

const dirsToClean: string[] = [];

afterEach(() => {
  vi.clearAllMocks();
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const makeTempFile = (name: string, contents?: string): string => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
  dirsToClean.push(dir);
  const file = join(dir, name);
  if (contents !== undefined) writeFileSync(file, contents);
  return file;
};

describe('getData', () => {
  it('reads and parses a local JSON file (absolute paths bypass BASE_DIR)', async () => {
    const file = makeTempFile('source.json', JSON.stringify({ hello: 'world' }));

    await expect(getData(file)).resolves.toEqual({ hello: 'world' });
  });

  it('fetches a single document for a collection/doc path', async () => {
    getMock.mockResolvedValue({ exists: true, data: () => ({ name: 'Yonatan' }) });

    const result = await getData('speakers/yonatan_levin');

    expect(collectionMock).toHaveBeenCalledWith('speakers');
    expect(docMock).toHaveBeenCalledWith('yonatan_levin');
    expect(result).toEqual({ name: 'Yonatan' });
  });

  it('throws when the requested document does not exist', async () => {
    getMock.mockResolvedValue({ exists: false });

    await expect(getData('speakers/missing')).rejects.toThrow(
      'Document speakers/missing not found.',
    );
  });

  it('fetches an entire collection for a collection-only path', async () => {
    getMock.mockResolvedValue({
      forEach: (callback: (doc: { id: string; data: () => unknown }) => void) => {
        callback({ id: 'a', data: () => ({ order: 0 }) });
        callback({ id: 'b', data: () => ({ order: 1 }) });
      },
    });

    const result = await getData('speakers');

    expect(collectionMock).toHaveBeenCalledWith('speakers');
    expect(result).toEqual({ a: { order: 0 }, b: { order: 1 } });
  });
});

describe('saveData', () => {
  it('writes JSON to a local file (absolute paths bypass BASE_DIR)', async () => {
    const file = makeTempFile('destination.json');

    await saveData({ hello: 'world' }, file);

    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ hello: 'world' });
  });

  it('sets a single document for a collection/doc path', async () => {
    await saveData({ name: 'Yonatan' }, 'speakers/yonatan_levin');

    expect(collectionMock).toHaveBeenCalledWith('speakers');
    expect(docMock).toHaveBeenCalledWith('yonatan_levin');
    expect(setMock).toHaveBeenCalledWith({ name: 'Yonatan' });
  });

  it('batch-sets every document for a collection-only path', async () => {
    await saveData({ a: { order: 0 }, b: { order: 1 } }, 'speakers');

    expect(batchMock).toHaveBeenCalled();
    expect(collectionMock).toHaveBeenCalledWith('speakers');
    expect(docMock).toHaveBeenCalledWith('a');
    expect(docMock).toHaveBeenCalledWith('b');
    expect(setMock).toHaveBeenCalledTimes(2);
    expect(commitMock).toHaveBeenCalled();
  });
});
