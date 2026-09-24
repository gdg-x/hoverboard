import { afterEach, describe, expect, it, vi } from 'vitest';
import { importConfig } from './config.js';

const { collectionMock, docMock, setMock, batchMock, commitMock } = vi.hoisted(() => {
  const setMock = vi.fn();
  const commitMock = vi.fn().mockResolvedValue([{}, {}]);
  const batchMock = vi.fn(() => ({ set: setMock, commit: commitMock }));
  const docMock = vi.fn((id: string) => `config/${id}`);
  const collectionMock = vi.fn(() => ({ doc: docMock }));
  return { collectionMock, docMock, setMock, batchMock, commitMock };
});

vi.mock('../../lib/firestore.js', () => ({
  firestore: { collection: collectionMock, batch: batchMock },
}));

vi.mock('../../../../../docs/default-firebase-data.json', () => ({
  default: {
    config: {
      site: { domain: 'example.com' },
      notifications: { icon: '/icon.png' },
    },
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('importConfig', () => {
  it('batch-sets a document per config key', async () => {
    await importConfig();

    expect(batchMock).toHaveBeenCalled();
    expect(collectionMock).toHaveBeenCalledWith('config');
    expect(docMock).toHaveBeenCalledWith('site');
    expect(docMock).toHaveBeenCalledWith('notifications');
    expect(setMock).toHaveBeenCalledWith('config/site', { domain: 'example.com' });
    expect(setMock).toHaveBeenCalledWith('config/notifications', { icon: '/icon.png' });
    expect(commitMock).toHaveBeenCalled();
  });
});
