import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runFirestoreCsv, toCsv } from './firestore-csv.js';

const { collectionMock } = vi.hoisted(() => ({ collectionMock: vi.fn() }));

vi.mock('../lib/firestore.js', () => ({ firestore: { collection: collectionMock } }));

describe('toCsv', () => {
  it('has an id column, then the fields in the order the documents first have them', () => {
    expect(
      toCsv([
        { id: 'a', data: { email: 'ada@example.com', firstName: 'Ada' } },
        { id: 'b', data: { email: 'grace@example.com', lastName: 'Hopper' } },
      ]),
    ).toBe(
      'id,email,firstName,lastName\r\n' +
        'a,ada@example.com,Ada,\r\n' +
        'b,grace@example.com,,Hopper\r\n',
    );
  });

  it('quotes commas, quotes and line breaks', () => {
    expect(toCsv([{ id: 'a', data: { name: 'Lovelace, "Ada"\nCountess' } }])).toBe(
      'id,name\r\na,"Lovelace, ""Ada""\nCountess"\r\n',
    );
  });

  it('keeps text that a spreadsheet would run as a formula from running', () => {
    const csv = toCsv([
      {
        id: 'a',
        data: { a: '=HYPERLINK("https://example.com")', b: '+1', c: '-1', d: '@SUM(A1)', e: -1 },
      },
    ]);

    expect(csv.split('\r\n')[1]).toBe(
      `a,"'=HYPERLINK(""https://example.com"")",'+1,'-1,'@SUM(A1),-1`,
    );
  });

  it('writes timestamps as ISO dates and other objects as JSON', () => {
    const date = new Date('2027-10-15T09:00:00Z');

    expect(
      toCsv([{ id: 'a', data: { at: { toDate: () => date }, tags: ['web', 'ai'], ok: true } }]),
    ).toBe('id,at,tags,ok\r\na,2027-10-15T09:00:00.000Z,"[""web"",""ai""]",true\r\n');
  });

  it('has only the header for an empty collection', () => {
    expect(toCsv([])).toBe('id\r\n');
  });
});

describe('runFirestoreCsv', () => {
  const dirs: string[] = [];
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('writes the collection to <collection>.csv in the directory it runs from', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'hoverboard-csv-'));
    dirs.push(dir);
    vi.stubEnv('INIT_CWD', dir);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    collectionMock.mockReturnValue({
      get: async () => ({
        size: 1,
        docs: [{ id: 'a', data: () => ({ email: 'ada@example.com' }) }],
      }),
    });

    await runFirestoreCsv('subscribers');

    expect(collectionMock).toHaveBeenCalledWith('subscribers');
    expect(readFileSync(join(dir, 'subscribers.csv'), 'utf8')).toBe(
      'id,email\r\na,ada@example.com\r\n',
    );
    expect(console.log).toHaveBeenCalledWith(
      `Wrote 1 document from subscribers to ${join(dir, 'subscribers.csv')}.`,
    );
  });
});
