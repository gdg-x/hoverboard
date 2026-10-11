import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ExportDocument } from './data-format.js';
import { UsageError } from './command.js';

/** An archived edition, in packages/config/editions.json. */
export interface Edition {
  year: number;
  /** The git tag of the site as it was at the end of the edition, such as `edition/2027`. */
  tag: string;
  projectId: string;
  url: string;
}

export const EDITIONS_PATH = 'packages/config/editions.json';

export const editionTag = (year: number): string => `edition/${year}`;

export const readEditions = (repoRoot: string): Edition[] => {
  const path = join(repoRoot, EDITIONS_PATH);
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Edition[]) : [];
};

/** Adds or replaces an edition, newest first. */
export const saveEdition = (repoRoot: string, edition: Edition): Edition[] => {
  const editions = [
    ...readEditions(repoRoot).filter(({ year }) => year !== edition.year),
    edition,
  ].sort((a, b) => b.year - a.year);
  writeFileSync(join(repoRoot, EDITIONS_PATH), `${JSON.stringify(editions, null, 2)}\n`);
  return editions;
};

export const findEdition = (repoRoot: string, year: number): Edition => {
  const edition = readEditions(repoRoot).find((entry) => entry.year === year);
  if (!edition) {
    throw new UsageError(`${EDITIONS_PATH} has no ${year} edition. ./hb edition list shows them.`);
  }
  return edition;
};

/**
 * Features an archived edition turns off: the ones that write, and the blog, which moves to the
 * current edition. The same list as `ARCHIVE_OFF` in packages/web/build/resolve-config.ts.
 */
export const ARCHIVE_OFF = [
  'blog',
  'demo',
  'feedback',
  'forkMe',
  'functions',
  'mySchedule',
  'notifications',
  'subscribe',
];

/** An edition's site.json as an archive: at its own address, read-only, linking to `current`. */
export const archiveSite = (
  site: Record<string, unknown>,
  { year, current, url }: { year: number; current: string; url: string },
): Record<string, unknown> => ({
  ...site,
  url,
  archive: { year, current },
  features: {
    ...(site['features'] as Record<string, boolean> | undefined),
    ...Object.fromEntries(ARCHIVE_OFF.map((feature) => [feature, false])),
  },
});

const toBlog = (url: unknown) => typeof url === 'string' && /^\/blog(\/|$)/.test(url);

/**
 * An edition's content/resources.json as an archive: without the links to the blog, which is off,
 * since the build rejects links to the pages of features that are off.
 */
export const archiveResources = (resources: Record<string, unknown>): Record<string, unknown> => {
  const footer = resources['footerRelBlock'] as { links: { url: string }[] }[] | undefined;
  const about = resources['aboutOrganizerBlock'] as
    { blocks: { callToAction: { link: string } }[] } | undefined;
  return {
    ...resources,
    ...(footer
      ? {
          footerRelBlock: footer.map((block) => ({
            ...block,
            links: block.links.filter(({ url }) => !toBlog(url)),
          })),
        }
      : {}),
    ...(about
      ? {
          aboutOrganizerBlock: {
            ...about,
            blocks: about.blocks.filter(({ callToAction }) => !toBlog(callToAction.link)),
          },
        }
      : {}),
  };
};

/** The year of an edition, from `event.startDate` in its site.json. */
export const editionYear = (site: Record<string, unknown>): number =>
  Number(String((site['event'] as { startDate?: string } | undefined)?.startDate).slice(0, 4));

const id = (path: string) => path.split('/').at(-1)!;

/**
 * This year's speakers with a session, as `previousSpeakers` documents: new ones, or the existing
 * ones with this year's sessions added and their details brought up to date. Speakers whose photo
 * is on another site are listed, since the photo may disappear.
 */
export const previousSpeakersFor = (
  {
    speakers,
    sessions,
    previous,
  }: { speakers: ExportDocument[]; sessions: ExportDocument[]; previous: ExportDocument[] },
  year: number,
  siteUrl?: string,
): { documents: ExportDocument[]; remotePhotos: string[] } => {
  const existing = new Map(previous.map((document) => [id(document.path), document.data]));
  const host = siteUrl ? new URL(siteUrl).host : undefined;
  const remotePhotos: string[] = [];
  const documents = speakers.flatMap(({ path, data: speaker }) => {
    const speakerId = id(path);
    const talks = sessions
      .filter(({ data }) => Array.isArray(data['speakers']) && data['speakers'].includes(speakerId))
      .map(({ data }) => ({
        title: data['title'],
        tags: data['tags'] ?? [],
        ...(data['presentation'] ? { presentation: data['presentation'] } : {}),
        ...(data['videoId'] ? { videoId: data['videoId'] } : {}),
      }));
    if (!talks.length) return [];
    const before = existing.get(speakerId);
    const photoUrl = String(speaker['photoUrl'] ?? '');
    if (/^https?:\/\//.test(photoUrl) && new URL(photoUrl).host !== host) {
      remotePhotos.push(speakerId);
    }
    return [
      {
        path: `previousSpeakers/${speakerId}`,
        data: {
          id: speakerId,
          name: speaker['name'],
          title: speaker['title'],
          company: speaker['company'],
          ...(speaker['companyLogo'] ? { companyLogo: speaker['companyLogo'] } : {}),
          country: speaker['country'],
          bio: speaker['bio'],
          photoUrl,
          socials: speaker['socials'] ?? [],
          order: before?.['order'] ?? speaker['order'] ?? 0,
          sessions: {
            ...(before?.['sessions'] as Record<string, unknown> | undefined),
            [String(year)]: talks,
          },
        },
      },
    ];
  });
  return { documents, remotePhotos };
};
