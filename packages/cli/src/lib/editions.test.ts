import { mkdirSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { documentMessages } from '../../../storage/validate.js';
import { readExport } from './data-format.js';
import {
  ARCHIVE_OFF,
  archiveResources,
  archiveSite,
  editionYear,
  findEdition,
  previousSpeakersFor,
  readEditions,
  saveEdition,
} from './editions.js';

const SAMPLE_DATA = join(import.meta.dirname, '..', '..', '..', '..', 'docs', 'sample-data');
const repos: string[] = [];

afterEach(() => {
  for (const repo of repos.splice(0)) rmSync(repo, { recursive: true, force: true });
});

describe('editions.json', () => {
  it('keeps the editions newest first, one per year', () => {
    const repo = mkdtempSync(join(tmpdir(), 'hoverboard-editions-'));
    repos.push(repo);
    mkdirSync(join(repo, 'packages/config'), { recursive: true });
    const edition = (year: number, projectId: string) => ({
      year,
      tag: `edition/${year}`,
      projectId,
      url: `https://${year}.example.com/`,
    });

    expect(readEditions(repo)).toEqual([]);
    saveEdition(repo, edition(2026, 'fest'));
    saveEdition(repo, edition(2027, 'fest-2027'));
    saveEdition(repo, edition(2026, 'fest-old'));

    expect(readEditions(repo).map(({ year, projectId }) => [year, projectId])).toEqual([
      [2027, 'fest-2027'],
      [2026, 'fest-old'],
    ]);
    expect(findEdition(repo, 2027).projectId).toBe('fest-2027');
    expect(() => findEdition(repo, 2020)).toThrow('has no 2020 edition');
  });
});

describe('archiveSite', () => {
  it('turns off the features the web build requires off in an archive', async () => {
    const web = await import('../../../web/build/resolve-config.js');
    expect(ARCHIVE_OFF).toEqual([...web.ARCHIVE_OFF]);
  });

  it('sets the address, the banner and the features of an archive', () => {
    const site = {
      shortName: 'DevFest',
      event: { startDate: '2027-10-15' },
      features: { blog: true, map: true },
    };

    expect(editionYear(site)).toBe(2027);
    expect(
      archiveSite(site, {
        year: 2027,
        current: 'https://example.com/',
        url: 'https://2027.example.com/',
      }),
    ).toEqual({
      ...site,
      url: 'https://2027.example.com/',
      archive: { year: 2027, current: 'https://example.com/' },
      features: {
        map: true,
        ...Object.fromEntries(ARCHIVE_OFF.map((feature) => [feature, false])),
      },
    });
  });
});

describe('previousSpeakersFor', () => {
  it('drops the links to the blog from the content of an archive', () => {
    const resources = {
      title: 'DevFest',
      footerRelBlock: [{ title: 'More', links: [{ url: '/blog' }, { url: '/team' }] }],
      aboutOrganizerBlock: {
        blocks: [{ callToAction: { link: '/blog/news' } }, { callToAction: { link: '/faq' } }],
      },
    };

    expect(archiveResources(resources)).toEqual({
      title: 'DevFest',
      footerRelBlock: [{ title: 'More', links: [{ url: '/team' }] }],
      aboutOrganizerBlock: { blocks: [{ callToAction: { link: '/faq' } }] },
    });
  });
  const { documents } = readExport(SAMPLE_DATA);
  const of = (collection: string) =>
    documents.filter(
      ({ path }) => path.split('/').length === 2 && path.startsWith(`${collection}/`),
    );

  it("adds this year's speakers with a session, as valid documents", () => {
    const { documents: added } = previousSpeakersFor(
      { speakers: of('speakers'), sessions: of('sessions'), previous: [] },
      2027,
    );

    expect(added.length).toBeGreaterThan(0);
    for (const { path, data } of added) {
      expect(documentMessages(path, data)).toEqual([]);
      expect(Object.keys(data['sessions'] as object)).toEqual(['2027']);
    }
  });

  it('keeps the earlier years of a previous speaker, and their order', () => {
    const speaker = {
      path: 'speakers/ada',
      data: { name: 'Ada', photoUrl: 'https://photos.example/ada.jpg', order: 3 },
    };
    const session = {
      path: 'sessions/101',
      data: { title: 'Engines', tags: ['Math'], speakers: ['ada'], videoId: 'abc' },
    };
    const previous = {
      path: 'previousSpeakers/ada',
      data: { order: 1, sessions: { '2026': [{ title: 'Notes', tags: [] }] } },
    };

    const result = previousSpeakersFor(
      {
        speakers: [speaker, { path: 'speakers/idle', data: {} }],
        sessions: [session],
        previous: [previous],
      },
      2027,
      'https://devfest.example/',
    );

    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]!.data).toMatchObject({
      order: 1,
      sessions: {
        '2026': [{ title: 'Notes', tags: [] }],
        '2027': [{ title: 'Engines', tags: ['Math'], videoId: 'abc' }],
      },
    });
    expect(result.remotePhotos).toEqual(['ada']);
  });
});
