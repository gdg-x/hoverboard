import { readFileSync } from 'fs';
import { connect } from 'net';
import { join } from 'path';
import { COLLECTIONS, type CollectionPath } from '../../../storage/collections.js';
import type { Session } from '../../../web/src/models/session.js';
import { buildSchedule, type Track } from '../../../web/src/schedule/build-schedule.js';
import {
  type CallForPapersDates,
  type SiteStages,
  type Stage,
  type StageChange,
  type TicketSaleDates,
  type TicketSales,
  siteStages,
} from '../../../web/src/utils/stages.js';
import type { CommandResult } from '../lib/command.js';
import { git, lines } from '../lib/git.js';
import { createGoogleCloud } from '../lib/google-cloud.js';
import { target } from '../lib/target.js';
import { CONFIG_DIR, resolveFirebaseProjectId, siteConfigDir } from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { siteFeatures } from '../utils/site-features.js';

type Json = Record<string, unknown>;

const DEFAULT_EMULATOR_HOST = '127.0.0.1:8080';
const MAX_LISTED = 20;

interface Release {
  releaseTime?: string;
  releaseUser?: { email?: string };
  message?: string;
}

export interface Deploy {
  time: string;
  by?: string;
  message?: string;
}

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as Json;

/**
 * The latest release of the project's default Hosting site, which has the project's ID. The
 * Hosting API lists releases newest first.
 */
export const lastDeploy = async (
  repoRoot: string,
  projectId: string,
): Promise<Deploy | undefined> => {
  const cloud = await createGoogleCloud(repoRoot, projectId);
  const { releases = [] } = await cloud.request<{ releases?: Release[] }>(
    'GET',
    `https://firebasehosting.googleapis.com/v1beta1/sites/${projectId}/releases?pageSize=1`,
  );
  const [release] = releases;
  return release?.releaseTime
    ? {
        time: release.releaseTime,
        ...(release.releaseUser?.email ? { by: release.releaseUser.email } : {}),
        ...(release.message ? { message: release.message } : {}),
      }
    : undefined;
};

/** The files the fork changed since the Hoverboard release it's on, outside packages/config. */
export const forkChanges = (repoRoot: string, version: string): string[] | undefined => {
  const tag = `v${version}`;
  if (git(repoRoot, ['rev-parse', '--verify', '--quiet', `${tag}^{commit}`]).status !== 0) {
    return undefined;
  }
  const { status, stdout } = git(repoRoot, ['diff', '--name-only', tag, 'HEAD']);
  return status === 0 ? lines(stdout).filter((path) => !path.startsWith(`${CONFIG_DIR}/`)) : [];
};

const reachable = (host: string): Promise<boolean> =>
  new Promise((resolve) => {
    const [hostname, port] = host.split(':');
    const socket = connect(Number(port), hostname);
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(1000);
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
  });

/** The document count of each collection the site uses, with the features that are on. */
const countDocuments = async (features: Record<string, boolean>) => {
  const { firestore } = await import('../lib/firestore.js');
  const counts: Record<string, number> = {};
  for (const [path, info] of Object.entries(COLLECTIONS)) {
    if (info.features.length && !info.features.some((feature) => features[feature])) continue;
    const segments = path.split('/');
    if (segments.length % 2 === 0) {
      counts[path] = (await firestore.doc(path).get()).exists ? 1 : 0;
    } else {
      const query =
        segments.length === 1
          ? firestore.collection(path)
          : firestore.collectionGroup(segments.at(-1)!);
      counts[path] = (await query.count().get()).data().count;
    }
  }
  return counts;
};

// The collection each feature's pages and home block show. The site hides them while it's empty.
const FEATURE_CONTENT: Record<string, CollectionPath> = {
  blog: 'blog',
  gallery: 'gallery',
  partners: 'partners/*/items',
  previousSpeakers: 'previousSpeakers',
  schedule: 'sessions',
  speakers: 'speakers',
  team: 'team/*/members',
  tickets: 'tickets',
  videos: 'videos',
};

/** The features that are on, but that the site hides, with the reason. */
const hiddenFeatures = (
  features: Record<string, boolean>,
  documents: Record<string, number>,
  published: boolean,
): { feature: string; reason: string }[] =>
  Object.entries(FEATURE_CONTENT).flatMap(([feature, path]) => {
    if (!features[feature]) return [];
    if (documents[path] === 0) return [{ feature, reason: `no ${path}` }];
    if (feature === 'schedule' && !published) {
      return [{ feature, reason: 'schedule.published is false' }];
    }
    return [];
  });

const STAGES: Record<Stage, string> = {
  announced: 'announced',
  callForPapers: 'call for papers',
  ticketSales: 'ticket sales',
  schedule: 'schedule',
  live: 'live',
  ended: 'ended',
  archived: 'archived',
};

const TICKET_SALES: Record<TicketSales, string> = {
  notYetOnSale: 'not yet on sale',
  onSale: 'on sale',
  soldOut: 'sold out',
  closed: 'closed',
};

const CHANGES: Record<StageChange, (date: string) => string> = {
  callForPapersOpens: (date) => `the call for papers opens on ${date}`,
  callForPapersCloses: (date) => `the call for papers closes after ${date}`,
  ticketsGoOnSale: (date) => `tickets go on sale on ${date}`,
  eventStarts: (date) => `the event starts on ${date}`,
  eventEnds: (date) => `the event ends after ${date}`,
};

const readCollection = async <T>(path: string): Promise<T[]> => {
  const { firestore } = await import('../lib/firestore.js');
  const { docs } = await firestore.collection(path).get();
  return docs.map((doc) => ({ ...doc.data(), id: doc.id }) as T);
};

/**
 * The stages the site is in now, from site.json and the target's tickets and sessions, and why the
 * schedule isn't one of them yet. None without the event's dates.
 */
const readStages = async (
  site: Json,
  features: Record<string, boolean>,
  schedule: { published: boolean; tracks: Track[] },
): Promise<{ stages: SiteStages; waiting?: string } | undefined> => {
  const event = site['event'] as { startDate?: string; endDate?: string; timezone?: string };
  if (!event?.startDate || !event.endDate) return undefined;
  const sessions =
    features['schedule'] && schedule.published ? await readCollection<Session>('sessions') : [];
  const days = buildSchedule({ sessions, speakers: [] }, schedule).schedule.length > 0;
  const stages = siteStages(Date.now(), {
    event: {
      startDate: event.startDate,
      endDate: event.endDate,
      timezone: event.timezone ?? 'UTC',
    },
    callForPapers: site['callForPapers'] as CallForPapersDates | undefined,
    tickets: features['tickets'] ? await readCollection<TicketSaleDates>('tickets') : [],
    schedule: !!features['schedule'] && days,
    archived: !!site['archive'],
  });
  const waiting =
    features['schedule'] && stages.stages.includes('announced') && !days
      ? schedule.published
        ? 'The schedule shows once sessions have a day and times.'
        : 'The schedule shows once schedule.published is true.'
      : undefined;
  return { stages, ...(waiting ? { waiting } : {}) };
};

const stagesLine = ({ stages, ticketSales }: SiteStages, site: Json) =>
  stages
    .map((stage) => {
      if (stage === 'callForPapers') {
        const { closes } = site['callForPapers'] as { closes: string };
        return `${STAGES[stage]} (closes after ${closes})`;
      }
      if (stage === 'ticketSales' && ticketSales) {
        return `${STAGES[stage]} (${TICKET_SALES[ticketSales]})`;
      }
      return STAGES[stage];
    })
    .join(', ');

/**
 * Prints what the site is: the project, the URL, the versions, the features, the last deploy, the
 * fork's changes to Hoverboard's files, the document count of each collection in the target, the
 * features the site hides for lack of content, and the stages the site is in.
 */
export const runStatus = async (): Promise<CommandResult> => {
  const repoRoot = findRepoRoot(process.cwd()) ?? process.cwd();
  const configDir = siteConfigDir(repoRoot);
  const site = readJson(join(repoRoot, configDir, 'site.json'));
  const projectId = resolveFirebaseProjectId(repoRoot);
  const url =
    (site['url'] as string | undefined) ??
    (projectId ? `https://${projectId}.web.app/` : undefined);
  const hoverboard = String(readJson(join(repoRoot, 'package.json'))['version']);
  const schemaVersion = site['schemaVersion'];
  const features = siteFeatures(repoRoot);
  const on = Object.keys(features).filter((feature) => features[feature]);
  const off = Object.keys(features).filter((feature) => !features[feature]);

  console.log(`Project: ${projectId ?? 'none'}${configDir === CONFIG_DIR ? '' : ' (the demo)'}`);
  if (url) console.log(`Site: ${url}`);
  console.log(`Hoverboard: ${hoverboard}, site.json schemaVersion ${String(schemaVersion)}`);
  console.log(`Features on: ${on.join(', ') || 'none'}`);
  console.log(`Features off: ${off.join(', ') || 'none'}`);

  let deploy: Deploy | undefined;
  let deployError: string | undefined;
  if (projectId) {
    try {
      deploy = await lastDeploy(repoRoot, projectId);
      console.log(
        deploy
          ? `Last deploy: ${deploy.time}${deploy.by ? ` by ${deploy.by}` : ''}` +
              `${deploy.message ? ` (${deploy.message})` : ''}`
          : 'Last deploy: none',
      );
    } catch (error) {
      deployError = error instanceof Error ? error.message : String(error);
      console.log(`Last deploy: unknown (${deployError})`);
    }
  }

  const changes = forkChanges(repoRoot, hoverboard);
  if (changes === undefined) {
    console.log(
      `Your changes: unknown, without the v${hoverboard} tag (git fetch --tags upstream)`,
    );
  } else {
    console.log(`Your changes to Hoverboard's files, outside ${CONFIG_DIR}: ${changes.length}`);
    for (const path of changes.slice(0, MAX_LISTED)) console.log(`  ${path}`);
    if (changes.length > MAX_LISTED) console.log(`  and ${changes.length - MAX_LISTED} more`);
  }

  const where = target() === 'production' ? projectId : 'the emulator';
  const host = process.env['FIRESTORE_EMULATOR_HOST'] ?? DEFAULT_EMULATOR_HOST;
  let documents: Record<string, number> | undefined;
  let hidden: string[] | undefined;
  let stages: SiteStages | undefined;
  if (target() === 'emulator' && !(await reachable(host))) {
    console.log(
      `Documents: unknown, the emulator isn't running. Start it with \`npm start\`, or add ` +
        '--production.',
    );
  } else {
    documents = await countDocuments(features);
    console.log(`Documents in ${where}:`);
    const width = Math.max(...Object.keys(documents).map((path) => path.length));
    for (const [path, count] of Object.entries(documents)) {
      console.log(`  ${path.padEnd(width)}  ${count}`);
    }
    const defaults = readJson(join(repoRoot, 'packages', 'web', 'defaults', 'site.json'));
    const schedule = { ...(defaults['schedule'] as Json), ...(site['schedule'] as Json) };
    const hiddenList = hiddenFeatures(features, documents, schedule['published'] !== false);
    hidden = hiddenList.map(({ feature }) => feature);
    if (hiddenList.length) {
      console.log('On, but hidden from the site until they have content:');
      for (const { feature, reason } of hiddenList) console.log(`  ${feature} (${reason})`);
    }

    const read = await readStages(site, features, {
      published: schedule['published'] !== false,
      tracks: (schedule['tracks'] as Track[] | undefined) ?? [],
    });
    if (read) {
      stages = read.stages;
      console.log(`Stages: ${stagesLine(stages, site)}`);
      if (stages.next) console.log(`Next: ${CHANGES[stages.next.change](stages.next.date)}`);
      if (read.waiting) console.log(read.waiting);
    }
  }

  return {
    ok: true,
    projectId,
    url,
    hoverboard,
    schemaVersion,
    features: on,
    ...(deploy ? { lastDeploy: deploy } : {}),
    ...(deployError ? { lastDeployError: deployError } : {}),
    ...(changes ? { changes } : {}),
    ...(documents ? { documents } : {}),
    ...(hidden ? { hidden } : {}),
    ...(stages ? { stages } : {}),
  };
};
