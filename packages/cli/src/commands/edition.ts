import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { deleteAllUsers } from '../lib/auth-users.js';
import { isBillingEnabled } from '../lib/billing.js';
import { type CommandResult, UsageError } from '../lib/command.js';
import { type ExportDocument, readExport, versions, writeExport } from '../lib/data-format.js';
import { listDeployedFunctions } from '../lib/deployed-functions.js';
import {
  type Edition,
  archiveResources,
  archiveSite,
  editionTag,
  editionYear,
  findEdition,
  previousSpeakersFor,
  readEditions,
  saveEdition,
} from '../lib/editions.js';
import {
  type AuthUser,
  createDatabase,
  createSchedule,
  databaseLocation,
  deleteSchedule,
  exportUsers,
  importUsers,
  listSchedules,
  pitrEnabled,
  retentionDays,
  setPitr,
} from '../lib/firebase-backups.js';
import { resolveFirebaseBin } from '../lib/firebase-cli.js';
import { fileAt, git, gitOutput, lines } from '../lib/git.js';
import { useFirebaseLoginCredentials } from '../lib/google-cloud.js';
import { ask, confirmChange } from '../lib/prompt.js';
import { runCommand } from '../lib/spawn.js';
import { setTarget } from '../lib/target.js';
import {
  CONFIG_DIR,
  SITE_CONFIG_PATH,
  demoDeployProblem,
  resolveFirebaseProjectId,
  siteConfigPath,
} from '../utils/firebase-project.js';
import { findRepoRoot } from '../utils/node-version.js';
import { firebaseProjects } from './init/firebase-projects.js';
import { toCsv } from './data-csv.js';

const RESOURCES_PATH = `${CONFIG_DIR}/content/resources.json`;

/** Copied to the new edition: what moves, and what it starts from. */
const COPIED = [
  'blog',
  'profiles',
  'config/notifications',
  'previousSpeakers',
  'team',
  'team/*/members',
  'partners',
  'partners/*/items',
  'gallery',
  'videos',
];

/** Deleted from the archive: what moved, and what only means something while it's current. */
const ARCHIVE_DELETES = [
  'blog',
  'profiles',
  'config/notifications',
  'notificationsSubscribers',
  'notificationsUsers',
  'featuredSessions',
  'notifications',
  'sentNotifications',
];

type Json = Record<string, unknown>;

const repoRootOf = () => findRepoRoot(process.cwd()) ?? process.cwd();

const readJson = (repoRoot: string, path: string) =>
  JSON.parse(readFileSync(join(repoRoot, path), 'utf8')) as Json;

const writeJson = (repoRoot: string, path: string, data: Json) =>
  writeFileSync(join(repoRoot, path), `${JSON.stringify(data, null, 2)}\n`);

/** Runs `hb` with arguments, for one step of an edition change, and stops when it fails. */
const hb = (repoRoot: string, args: string[], env: Record<string, string> = {}) => {
  if (runCommand(process.execPath, ['hb', ...args], repoRoot, env) !== 0) {
    throw new Error(`./hb ${args.join(' ')} failed. Fix it, then run the command again.`);
  }
};

const firebase = (repoRoot: string, args: string[], cwd = repoRoot) => {
  if (runCommand(resolveFirebaseBin(cwd), args, cwd) !== 0) {
    throw new Error(`firebase ${args[0]} failed.`);
  }
};

/** The site's address: `url` in site.json, or its default on the project's own domain. */
const siteUrl = (site: Json, projectId: string) =>
  (site['url'] as string | undefined) ?? `https://${projectId}.web.app/`;

const isDefaultDomain = (url: string) => /\.(web\.app|firebaseapp\.com)$/.test(new URL(url).host);

const tempDir = (prefix: string) => mkdtempSync(join(tmpdir(), prefix));

/** Exports collections of a project with a child `hb`, since a process has one Firestore target. */
const exportFrom = (
  repoRoot: string,
  projectId: string,
  collections: string[],
): ExportDocument[] => {
  const folder = join(tempDir('hb-edition-'), 'export');
  try {
    hb(
      repoRoot,
      [
        'data',
        'export',
        folder,
        ...collections.flatMap((path) => ['--collection', path]),
        '--production',
      ],
      { GCLOUD_PROJECT: projectId },
    );
    return readExport(folder).documents;
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
};

/** Imports documents into a project with a child `hb`. */
const importInto = (
  repoRoot: string,
  projectId: string,
  documents: ExportDocument[],
  command: string,
) => {
  const folder = join(tempDir('hb-edition-'), 'import');
  try {
    writeExport(folder, documents, {
      ...versions(repoRoot),
      projectId,
      createdAt: new Date().toISOString(),
      command,
    });
    hb(repoRoot, ['data', 'import', folder, '--production', '--yes'], {
      GCLOUD_PROJECT: projectId,
    });
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
};

const readUsers = (file: string): AuthUser[] =>
  (JSON.parse(readFileSync(file, 'utf8')) as { users?: AuthUser[] }).users ?? [];

/**
 * Copies the Auth users of one project to another, keeping their IDs. Only the users `to` doesn't
 * have, and without the ones with a password, since importing those needs their hash settings.
 */
const copyUsers = async (repoRoot: string, from: string, to: string): Promise<number> => {
  const dir = tempDir('hb-users-');
  try {
    await exportUsers(repoRoot, from, join(dir, 'from.json'));
    await exportUsers(repoRoot, to, join(dir, 'to.json'));
    const there = new Set(readUsers(join(dir, 'to.json')).map(({ localId }) => localId));
    const users = readUsers(join(dir, 'from.json')).filter(
      ({ localId, passwordHash }) => !passwordHash && !there.has(localId),
    );
    if (!users.length) return 0;
    writeFileSync(join(dir, 'import.json'), JSON.stringify({ users }));
    await importUsers(repoRoot, to, join(dir, 'import.json'));
    return users.length;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const commit = (repoRoot: string, paths: string[], message: string) => {
  gitOutput(repoRoot, ['add', '--', ...paths]);
  if (git(repoRoot, ['diff', '--cached', '--quiet']).status !== 0) {
    gitOutput(repoRoot, ['commit', '--quiet', '-m', message]);
  }
};

const printPlan = (title: string, steps: string[]) => {
  console.log(title);
  steps.forEach((step, index) => console.log(`  ${index + 1}. ${step}`));
};

/** Lists the archived editions in editions.json, and the current one. */
export const runEditionList = (): CommandResult => {
  const repoRoot = repoRootOf();
  const site = readJson(repoRoot, siteConfigPath(repoRoot));
  const projectId = resolveFirebaseProjectId(repoRoot) ?? '';
  const current = { year: editionYear(site), projectId, url: siteUrl(site, projectId) };
  console.log(`Current: ${current.year}, ${current.url}, on ${projectId}`);
  const editions = readEditions(repoRoot).map((edition) => {
    const packageJson = fileAt(repoRoot, edition.tag, 'package.json');
    const version = packageJson
      ? (JSON.parse(packageJson) as { version?: string }).version
      : undefined;
    console.log(
      `${edition.year}: ${edition.url}, on ${edition.projectId}, ` +
        (version ? `Hoverboard v${version}` : `no ${edition.tag} tag here`),
    );
    return { ...edition, ...(version ? { hoverboard: version } : {}) };
  });
  if (!editions.length) console.log('No archived editions. ./hb edition new starts the next one.');
  return { ok: true, current, editions };
};

/**
 * Writes the feedback of every session to a CSV file, one per session, for organizers to send
 * to speakers. From the current edition, or with `year`, an archived one. Without user IDs.
 */
export const runEditionFeedback = async (
  year?: string,
  { folder }: { folder?: string } = {},
): Promise<CommandResult> => {
  const repoRoot = repoRootOf();
  const site = readJson(repoRoot, siteConfigPath(repoRoot));
  const edition =
    year && Number(year) !== editionYear(site) ? findEdition(repoRoot, Number(year)) : undefined;
  if (edition) {
    // Before lib/firestore loads, so it connects to the archive's project.
    process.env['GCLOUD_PROJECT'] = edition.projectId;
    setTarget('production');
  }
  const { firestore } = await import('../lib/firestore.js');
  const output = resolve(
    process.env['INIT_CWD'] ?? process.cwd(),
    folder ?? `feedback-${edition?.year ?? editionYear(site)}`,
  );
  mkdirSync(output, { recursive: true });
  const sessions = (await firestore.collection('sessions').get()).docs;
  const summary: { id: string; data: Json }[] = [];
  let responses = 0;
  for (const session of sessions) {
    const feedback = (await session.ref.collection('feedback').get()).docs.map((doc) => doc.data());
    if (!feedback.length) continue;
    responses += feedback.length;
    const average = (field: string) =>
      Math.round(
        (feedback.reduce((sum, row) => sum + Number(row[field] ?? 0), 0) / feedback.length) * 10,
      ) / 10;
    summary.push({
      id: session.id,
      data: {
        title: session.get('title'),
        responses: feedback.length,
        contentRating: average('contentRating'),
        styleRating: average('styleRating'),
      },
    });
    writeFileSync(
      join(output, `${session.id}.csv`),
      toCsv(
        feedback.map(({ contentRating, styleRating, comment }, index) => ({
          id: String(index + 1),
          data: { contentRating, styleRating, comment },
        })),
      ),
    );
  }
  writeFileSync(join(output, 'sessions.csv'), toCsv(summary));
  console.log(
    `\u2714 Wrote the feedback of ${summary.length} sessions, ${responses} responses, to ${output}.`,
  );
  return { ok: true, folder: output, sessions: summary.length, responses };
};

/**
 * Builds an edition from its tag, with the archive settings over its site.json, and deploys it
 * to its project. The build reads the archive's own Firestore.
 */
const deployArchive = async (repoRoot: string, edition: Edition, current: string) => {
  const dir = tempDir('hb-archive-');
  gitOutput(repoRoot, ['worktree', 'add', '--quiet', '--detach', dir, edition.tag]);
  try {
    const sitePath = [SITE_CONFIG_PATH, 'packages/demo-config/site.json'].find(
      (path) => fileAt(repoRoot, edition.tag, path) !== undefined,
    )!;
    writeJson(
      dir,
      sitePath,
      archiveSite(readJson(dir, sitePath), { year: edition.year, current, url: edition.url }),
    );
    const resourcesPath = join(dirname(sitePath), 'content/resources.json');
    writeJson(dir, resourcesPath, archiveResources(readJson(dir, resourcesPath)));
    console.log(`\nInstalling the dependencies of ${edition.tag}...`);
    if (runCommand('npm', ['ci'], dir) !== 0) throw new Error(`npm ci failed in ${edition.tag}.`);
    await useFirebaseLoginCredentials(repoRoot);
    console.log(`\nBuilding the ${edition.year} archive from ${edition.projectId}...`);
    const env = { FIRESTORE_TARGET: 'production', GCLOUD_PROJECT: edition.projectId };
    if (runCommand('npm', ['run', 'build'], dir, env) !== 0) {
      throw new Error(`The build of the ${edition.year} archive failed.`);
    }
    firebase(
      repoRoot,
      ['deploy', '--only', 'hosting', '--project', edition.projectId, '--non-interactive'],
      dir,
    );
  } finally {
    git(repoRoot, ['worktree', 'remove', '--force', dir]);
    rmSync(dir, { recursive: true, force: true });
  }
};

/** The current edition's address, for the archives' banners. */
const currentUrl = (repoRoot: string) => {
  const site = readJson(repoRoot, siteConfigPath(repoRoot));
  return siteUrl(site, resolveFirebaseProjectId(repoRoot) ?? '');
};

/** Builds and deploys an archived edition again from its tag, such as after a security fix. */
export const runEditionRebuild = async (
  year: string,
  { dryRun = false, yes = false } = {},
): Promise<CommandResult | false> => {
  const repoRoot = repoRootOf();
  const edition = findEdition(repoRoot, Number(year));
  if (!fileAt(repoRoot, edition.tag, 'package.json')) {
    throw new UsageError(`There's no ${edition.tag} tag. Fetch it with git fetch --tags.`);
  }
  console.log(
    `Rebuild the ${edition.year} archive from ${edition.tag}, and deploy it to ${edition.projectId}.`,
  );
  if (dryRun) return { ok: true, edition, dryRun };
  if (!(await confirmChange(`Deploy the ${edition.year} archive to ${edition.projectId}?`, yes))) {
    return false;
  }
  await deployArchive(repoRoot, edition, currentUrl(repoRoot));
  console.log(`\n\u2714 Deployed the ${edition.year} archive to ${edition.url}`);
  return { ok: true, edition };
};

export interface EditionNewOptions {
  /** The new edition's Firebase project. */
  project?: string;
  dryRun?: boolean;
  yes?: boolean;
}

/** A project ID for the next edition, such as `devfest-ua-2028` after `devfest-ua`. */
export const suggestProjectId = (current: string, year: number): string =>
  `${current.replace(/-\d{4}$/, '').slice(0, 25)}-${year}`;

/**
 * Prepares the next edition in a new Firebase project, without changing the current site: backs
 * up and tags the current edition, creates the project, copies what carries over, points
 * site.json at it and deploys it. `hb edition switch` archives the old project later. Safe to
 * re-run after a step fails.
 */
export const runEditionNew = async ({
  project,
  dryRun = false,
  yes = false,
}: EditionNewOptions = {}): Promise<CommandResult | false> => {
  const repoRoot = repoRootOf();
  const demo = demoDeployProblem(repoRoot);
  if (demo) throw new UsageError(demo);
  const site = readJson(repoRoot, SITE_CONFIG_PATH);
  const from = resolveFirebaseProjectId(repoRoot);
  if (!from) throw new UsageError('No Firebase project. Set firebase.projectId in site.json.');
  const year = editionYear(site);
  const tag = editionTag(year);
  if (readEditions(repoRoot).some((edition) => edition.year === year)) {
    throw new UsageError(`The ${year} edition is already archived. Change event.startDate first.`);
  }
  let to = project;
  if (!to) {
    if (!process.stdin.isTTY) throw new UsageError('Pass the new project with --project.');
    to = await ask("The next edition's Firebase project ID:", suggestProjectId(from, year + 1));
  }
  if (to === from) throw new UsageError(`${to} is the current edition's project.`);
  if (gitOutput(repoRoot, ['status', '--porcelain'])) {
    console.log('\u2718 Commit or stash your changes first.');
    return false;
  }
  const url = siteUrl(site, from);
  if (isDefaultDomain(url)) {
    console.log(
      `! ${url} is the project's own address, so the site's address changes with each edition. ` +
        'A custom domain moves to the new edition instead: set it up first (see ' +
        'docs/tutorials/07-next-edition.md).',
    );
  }

  printPlan(`Start the next edition in ${to}. The current site, ${url}, doesn't change.`, [
    `Check the data of ${from}, and back it up`,
    `Tag the current commit ${tag}, and push the tag`,
    `Create ${to} with a web app, and Firestore where ${from} has it, and let the deploy account deploy to it`,
    `Copy ${COPIED.join(', ')}, and the Auth users, to ${to}, with this year's speakers added to previousSpeakers`,
    `Point ${SITE_CONFIG_PATH} at ${to}, and commit`,
    `Deploy ${to}`,
  ]);
  if (dryRun) return { ok: true, from, to, year, dryRun };
  if (!(await confirmChange(`\nStart the next edition in ${to}?`, yes))) return false;

  hb(repoRoot, ['data', 'check', '--production']);

  const projects = firebaseProjects(repoRoot);
  if (!projects.list().some(({ projectId }) => projectId === to)) {
    console.log(`\nCreating the Firebase project ${to}...`);
    projects.create(to, to);
  }
  if (!projects.webApps(to).length) projects.createWebApp(to, 'Hoverboard');
  if (!(await isBillingEnabled(repoRoot, to).catch(() => false))) {
    console.log(
      `\n\u2718 ${to} isn't on the Blaze plan, which the functions need. Link it to a billing account, ` +
        `such as ${from}'s, at https://console.firebase.google.com/project/${to}/usage/details, then ` +
        `run ./hb edition new --project ${to} again.`,
    );
    return false;
  }

  hb(repoRoot, ['backup', 'create', '--production']);
  if (git(repoRoot, ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`]).status !== 0) {
    gitOutput(repoRoot, ['tag', tag]);
  }
  if (lines(gitOutput(repoRoot, ['remote'])).includes('origin')) {
    gitOutput(repoRoot, ['push', '--quiet', 'origin', tag]);
  }

  const location = await databaseLocation(repoRoot, from);
  if (!(await databaseLocation(repoRoot, to))) {
    if (!location) throw new Error(`Couldn't find where ${from}'s Firestore database is.`);
    console.log(`Creating ${to}'s Firestore database in ${location}...`);
    await createDatabase(repoRoot, to, location);
  }
  if (
    runCommand(process.execPath, ['hb', 'setup-github', '--project', to, '--yes'], repoRoot) !== 0
  ) {
    console.log(
      `! GitHub Actions can't deploy to ${to} yet. Run ./hb setup-github --project ${to}.`,
    );
  }

  console.log(`\nCopying to ${to}...`);
  const exported = exportFrom(repoRoot, from, [...COPIED, 'speakers', 'sessions']);
  const of = (entry: string) =>
    exported.filter(({ path }) => path.split('/').length === 2 && path.startsWith(`${entry}/`));
  const { documents: speakers, remotePhotos } = previousSpeakersFor(
    { speakers: of('speakers'), sessions: of('sessions'), previous: of('previousSpeakers') },
    year,
    url,
  );
  const updated = new Set(speakers.map(({ path }) => path));
  const copied = [
    ...exported.filter(
      ({ path }) =>
        !path.startsWith('speakers/') && !path.startsWith('sessions/') && !updated.has(path),
    ),
    ...speakers,
  ];
  importInto(repoRoot, to, copied, `hb edition new from ${from}`);
  const users = await copyUsers(repoRoot, from, to);
  console.log(`\u2714 Copied ${copied.length} documents and ${users} Auth users to ${to}.`);
  if (remotePhotos.length) {
    console.log(
      `! The photos of ${remotePhotos.join(', ')} are on other sites, and may disappear. Copy them ` +
        `to ${CONFIG_DIR}/public to keep them.`,
    );
  }

  const tracks = ((site['schedule'] as { tracks?: Json[] } | undefined)?.tracks ?? []).map(
    ({ days: _days, ...track }) => track,
  );
  const next: Json = {
    ...site,
    firebase: { ...(site['firebase'] as Json), projectId: to },
    ...(site['schedule'] ? { schedule: { ...(site['schedule'] as Json), tracks } } : {}),
  };
  if (isDefaultDomain(url)) delete next['url'];
  writeJson(repoRoot, SITE_CONFIG_PATH, next);
  const resources = readJson(repoRoot, RESOURCES_PATH);
  const attending = resources['attendingPage'] as Json | undefined;
  if (attending?.['doors']) {
    const { doors: _doors, ...rest } = attending;
    writeJson(repoRoot, RESOURCES_PATH, { ...resources, attendingPage: rest });
  }
  const prettier = join(repoRoot, 'node_modules', '.bin', 'prettier');
  runCommand(
    prettier,
    ['--log-level', 'warn', '--write', SITE_CONFIG_PATH, RESOURCES_PATH],
    repoRoot,
  );
  commit(
    repoRoot,
    [SITE_CONFIG_PATH, RESOURCES_PATH],
    `chore: start the ${year + 1} edition in ${to}`,
  );
  const withYear = Object.entries((resources['heroDescriptions'] as Json | undefined) ?? {})
    .filter(([, text]) => String(text).includes(String(year)))
    .map(([page]) => page);

  hb(repoRoot, ['deploy', '--yes']);

  console.log(
    [
      `\n\u2714 The ${year + 1} edition is on ${to}, at https://${to}.web.app/. ${url} still shows ${year}.`,
      'Next:',
      `  - Update the name, dates, venue and ticket link with ./hb init --project ${to}, and the`,
      "    schedule tracks' days and the doors, which were cleared.",
      ...(withYear.length ? [`  - heroDescriptions mention ${year}: ${withYear.join(', ')}.`] : []),
      `  - Export the ${year} subscribers and partner leads, which stay in the archive:`,
      '    ./hb data export --csv --collection subscribers --collection potentialPartners --production',
      ...(isDefaultDomain(url)
        ? []
        : [
            `  - In the Firebase console, move ${new URL(url).host} from ${from}'s Hosting to ${to}'s,`,
            `    and add a subdomain such as ${year}.${new URL(url).host} to ${from}, with its DNS records.`,
          ]),
      `  - Then run ./hb edition switch, which archives ${from}.`,
    ].join('\n'),
  );
  return { ok: true, from, to, year, documents: copied.length, users };
};

/** The newest edition tag that isn't archived yet, with the project its site.json names. */
const pendingEdition = (
  repoRoot: string,
): { year: number; tag: string; projectId: string; site: Json } => {
  const archived = new Set(readEditions(repoRoot).map(({ year }) => year));
  const tags = lines(gitOutput(repoRoot, ['tag', '--list', 'edition/*']))
    .map((tag) => ({ tag, year: Number(tag.slice('edition/'.length)) }))
    .filter(({ year }) => Number.isInteger(year) && !archived.has(year))
    .sort((a, b) => b.year - a.year);
  const [latest] = tags;
  if (!latest) throw new UsageError('No edition to archive. Run ./hb edition new first.');
  const raw = fileAt(repoRoot, latest.tag, SITE_CONFIG_PATH);
  if (!raw) throw new UsageError(`${latest.tag} has no ${SITE_CONFIG_PATH}.`);
  const site = JSON.parse(raw) as Json;
  const projectId = (site['firebase'] as { projectId?: string } | undefined)?.projectId;
  if (!projectId) throw new UsageError(`${latest.tag} has no firebase.projectId.`);
  return { ...latest, projectId, site };
};

/**
 * Archives the previous edition once the domain points at the new one: copies what visitors wrote
 * since, then makes the old project read-only, with its archived build, and moves the backups.
 */
export const runEditionSwitch = async ({
  archiveUrl,
  dryRun = false,
  yes = false,
}: { archiveUrl?: string; dryRun?: boolean; yes?: boolean } = {}): Promise<
  CommandResult | false
> => {
  const repoRoot = repoRootOf();
  const to = resolveFirebaseProjectId(repoRoot);
  const pending = pendingEdition(repoRoot);
  const from = pending.projectId;
  if (!to || to === from) {
    throw new UsageError(`${SITE_CONFIG_PATH} still names ${from}. Run ./hb edition new first.`);
  }
  if (gitOutput(repoRoot, ['status', '--porcelain'])) {
    console.log('\u2718 Commit or stash your changes first.');
    return false;
  }
  const current = currentUrl(repoRoot);
  const edition: Edition = {
    year: pending.year,
    tag: pending.tag,
    projectId: from,
    url: archiveUrl ?? `https://${from}.web.app/`,
  };

  printPlan(`Archive the ${edition.year} edition in ${from}, at ${edition.url}.`, [
    `Copy the profiles and Auth users written since to ${to}`,
    `Back up ${from}`,
    `Delete ${from}'s functions, deploy the archive rules, and delete ${ARCHIVE_DELETES.join(', ')} and the Auth users`,
    `Build the ${edition.year} archive from ${edition.tag}, and deploy it to ${from}`,
    `Move the backup schedule and point-in-time recovery to ${to}`,
    'Record the edition in packages/config/editions.json, and commit',
  ]);
  if (dryRun) return { ok: true, edition, to, dryRun };
  if (
    !(await confirmChange(
      `\nArchive ${from}? Its visitors' data that didn't move is deleted.`,
      yes,
    ))
  ) {
    return false;
  }

  const profiles = exportFrom(repoRoot, from, ['profiles']);
  if (profiles.length) importInto(repoRoot, to, profiles, `hb edition switch from ${from}`);
  const users = await copyUsers(repoRoot, from, to);
  console.log(`\u2714 Copied ${profiles.length} profiles and ${users} new Auth users to ${to}.`);

  hb(repoRoot, ['backup', 'create', '--production'], { GCLOUD_PROJECT: from });

  const functions = await listDeployedFunctions(repoRoot, from);
  if (functions.length) {
    firebase(repoRoot, [
      'functions:delete',
      ...new Set(functions.map(({ id }) => id)),
      '--force',
      '--project',
      from,
    ]);
  }
  mkdirSync(join(repoRoot, '.firebase'), { recursive: true });
  // The Firebase CLI reads the paths in a config from the config's folder (verify).
  writeFileSync(
    join(repoRoot, '.firebase/archive.firebase.json'),
    JSON.stringify({
      firestore: {
        rules: '../packages/storage/firestore.archive.rules',
        indexes: '../packages/storage/firestore.indexes.json',
      },
    }),
  );
  firebase(repoRoot, [
    'deploy',
    '--only',
    'firestore',
    '--config',
    '.firebase/archive.firebase.json',
    '--project',
    from,
    '--non-interactive',
  ]);
  for (const path of ARCHIVE_DELETES) {
    const document = path.split('/').length % 2 === 0;
    firebase(repoRoot, [
      'firestore:delete',
      path,
      ...(document ? [] : ['--recursive']),
      '--force',
      '--project',
      from,
    ]);
  }
  const deleted = await deleteAllUsers(repoRoot, from);
  console.log(`\u2714 Deleted ${deleted} Auth users from ${from}.`);

  await deployArchive(repoRoot, edition, current);

  try {
    for (const schedule of await listSchedules(repoRoot, from)) {
      await createSchedule(repoRoot, to, {
        ...(schedule.weeklyRecurrence ? { weekly: schedule.weeklyRecurrence.day } : {}),
        retentionDays: retentionDays(schedule),
      });
      await deleteSchedule(repoRoot, from, schedule.name);
    }
    if (await pitrEnabled(repoRoot, from)) {
      await setPitr(repoRoot, to, true);
      await setPitr(repoRoot, from, false);
    }
  } catch (error) {
    console.log(`! Couldn't move the backup schedule: ${(error as Error).message}`);
  }

  saveEdition(repoRoot, edition);
  runCommand(
    join(repoRoot, 'node_modules', '.bin', 'prettier'),
    ['--log-level', 'warn', '--write', 'packages/config/editions.json'],
    repoRoot,
  );
  commit(repoRoot, ['packages/config/editions.json'], `chore: archive the ${edition.year} edition`);

  console.log(
    [
      `\n\u2714 Archived the ${edition.year} edition at ${edition.url}. The current one is ${current}.`,
      `  ${from} has no functions now. Move it back to the free Spark plan, so the archive costs`,
      `  nothing: https://console.firebase.google.com/project/${from}/usage/details (verify).`,
    ].join('\n'),
  );
  return { ok: true, edition, to, users, deletedUsers: deleted };
};
