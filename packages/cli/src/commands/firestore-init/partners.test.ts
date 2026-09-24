import { afterEach, describe, expect, it, vi } from 'vitest';
import { importPartners } from './partners.js';

const { partnersCollectionMock, docMock, itemsCollectionMock, itemDocMock, setMock } = vi.hoisted(
  () => {
    const setMock = vi.fn();
    const itemDocMock = vi.fn((id: string) => `items/${id}`);
    const itemsCollectionMock = vi.fn(() => ({ doc: itemDocMock }));
    const docMock = vi.fn(() => ({ collection: itemsCollectionMock }));
    const partnersCollectionMock = vi.fn(() => ({ doc: docMock }));
    return { partnersCollectionMock, docMock, itemsCollectionMock, itemDocMock, setMock };
  },
);

vi.mock('../../lib/firestore.js', () => ({
  firestore: {
    collection: partnersCollectionMock,
    batch: vi.fn(() => ({ set: setMock, commit: vi.fn().mockResolvedValue([{}, {}]) })),
  },
}));

vi.mock('../../../../../docs/default-firebase-data.json', () => ({
  default: {
    partners: [
      { order: 0, title: 'Template Creator', items: [{ order: 0, name: 'GDG Lviv' }] },
      null,
    ],
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('importPartners', () => {
  it('batch-sets each partner document and its nested items, warning about missing ones', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await importPartners();

    expect(partnersCollectionMock).toHaveBeenCalledWith('partners');
    expect(docMock).toHaveBeenCalledWith('0');
    expect(setMock).toHaveBeenCalledWith(docMock.mock.results[0]?.value, {
      title: 'Template Creator',
      order: 0,
    });
    expect(itemsCollectionMock).toHaveBeenCalledWith('items');
    expect(itemDocMock).toHaveBeenCalledWith('000');
    expect(setMock).toHaveBeenCalledWith('items/000', { order: 0, name: 'GDG Lviv' });
    expect(warnSpy).toHaveBeenCalledWith('Missing partner 1');
  });
});
