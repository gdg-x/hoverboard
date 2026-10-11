import { cpSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { isBillingEnabled } from '../../lib/billing.js';
import { createDatabase, databaseLocation } from '../../lib/firebase-backups.js';
import { resolveFirebaseBin } from '../../lib/firebase-cli.js';
import { ask, confirm } from '../../lib/prompt.js';
import { runCommand } from '../../lib/spawn.js';
import {
  CONFIG_DIR,
  DEMO_CONFIG_DIR,
  SITE_CONFIG_PATH,
  resolveFirebaseProjectId,
  siteConfigPath,
} from '../../utils/firebase-project.js';
import { checkNodeVersion, findRepoRoot } from '../../utils/node-version.js';
import { validateSiteConfig } from '../../utils/site-config.js';
import { functionsEnabled } from '../../utils/site-features.js';
import { runDeploy } from '../deploy.js';
import { runDoctor } from '../doctor.js';
import { type FirebaseProjects, firebaseProjects } from './firebase-projects.js';
import { type SiteImages, copySiteImages } from './images.js';
import { setUpRepository } from './repository.js';
import {
  PROJECT_ID_PATTERN,
  type SiteDetails,
  applySiteDetails,
  askSiteDetails,
  currentDetails,
  defaultUrl,
} from './site-details.js';
import { askStarterText, mergeText, starterResources } from './starter-text.js';

export interface InitOptions {
  /** The Firebase project. Without it, the wizard lists the account's projects. */
  project?: string;
  /** Create `project` instead of using an existing one. */
  create?: boolean;
  /** A JSON file with the site details, instead of asking for them. */
  details?: string;
  /** Deploy without asking, or with `false`, skip it. */
  deploy?: boolean;
  /** Add the sample content without asking, or with `false`, start with empty collections. */
  seed?: boolean;
  /** Start with the content of an export from `hb data export`, such as last year's site. */
  from?: string;
  /** The Firestore location, when the project has no database yet, such as `eur3`. */
  location?: string;
  /** Files to copy into packages/config/public/images. */
  logo?: string;
  icon?: string;
  shareImage?: string;
  /** The GitHub repository to create, or with `false`, skip it. */
  repo?: string | false;
  /** Schedule daily backups on the Blaze plan without asking, or with `false`, skip them. */
  backups?: boolean;
}

type Json = Record<string, unknown>;

const RESOURCES_PATH = 'packages/config/content/resources.json';
const DEFAULTS_PATH = 'packages/web/defaults/site.json';
const SCHEMA_PATH = 'packages/web/schemas/site.schema.json';
const FEATURES_MODULE = 'packages/web/src/config/features.ts';

const readJson = (repoRoot: string, path: string) =>
  JSON.parse(readFileSync(join(repoRoot, path), 'utf8')) as Json;

const writeJson = (repoRoot: string, path: string, data: Json) =>
  writeFileSync(join(repoRoot, path), `${JSON.stringify(data, null, 2)}\n`);

const readSiteProjectId = (repoRoot: string) => {
  const firebase = (readJson(repoRoot, siteConfigPath(repoRoot))['firebase'] ?? {}) as Json;
  return typeof firebase['projectId'] === 'string' ? firebase['projectId'] : undefined;
};

/** Starts the site's config from a copy of the demo's, without its package.json. */
const copyDemoConfig = (repoRoot: string) => {
  const demo = join(repoRoot, DEMO_CONFIG_DIR);
  cpSync(demo, join(repoRoot, CONFIG_DIR), {
    recursive: true,
    filter: (source) => source !== join(demo, 'package.json'),
  });
  console.log(`✔ Copied ${DEMO_CONFIG_DIR} to ${CONFIG_DIR}. Commit ${CONFIG_DIR}.`);
};

/** `FEATURE_REQUIRES` from the web app, the same rules the site.json validation checks. */
const loadFeatureRequires = async (repoRoot: string) => {
  const module = (await import(pathToFileURL(join(repoRoot, FEATURES_MODULE)).href)) as {
    FEATURE_REQUIRES: Partial<Record<string, readonly string[]>>;
  };
  return module.FEATURE_REQUIRES;
};

/** The built-in theme names, from the site.json schema. */
const readThemes = (repoRoot: string) => {
  const schema = readJson(repoRoot, SCHEMA_PATH) as {
    properties: { theme: { properties: { name: { enum: string[] } } } };
  };
  return schema.properties.theme.properties.name.enum;
};

const chooseProject = async (
  projects: FirebaseProjects,
  current: string | undefined,
): Promise<{ projectId: string; create: boolean }> => {
  const existing = projects.list();
  console.log('\nFirebase projects:');
  existing.forEach(({ projectId, displayName }, index) =>
    console.log(`  ${index + 1}. ${projectId}${displayName ? ` (${displayName})` : ''}`),
  );
  console.log(`  ${existing.length + 1}. Create a new project`);

  const currentIndex = existing.findIndex(({ projectId }) => projectId === current);
  for (;;) {
    const answer = await ask(
      'Project number or ID:',
      String(currentIndex >= 0 ? currentIndex + 1 : existing.length + 1),
    );
    const chosen = existing[Number(answer) - 1] ?? existing.find((p) => p.projectId === answer);
    if (chosen) return { projectId: chosen.projectId, create: false };
    if (answer === String(existing.length + 1) || PROJECT_ID_PATTERN.test(answer)) {
      const projectId = answer === String(existing.length + 1) ? await askNewProjectId() : answer;
      return { projectId, create: true };
    }
    console.log('  Pick a number from the list, or type a project ID.');
  }
};

const askNewProjectId = async (): Promise<string> => {
  for (;;) {
    const projectId = await ask(
      'New project ID (6 to 30 lowercase letters, digits and hyphens, such as devfest-lviv-2027):',
    );
    if (PROJECT_ID_PATTERN.test(projectId)) return projectId;
    console.log('  Start with a letter, and use only lowercase letters, digits and hyphens.');
  }
};

/** Firestore locations to suggest. Any location Firestore supports works. */
const LOCATIONS = 'nam5 (United States), eur3 (Europe), or a region such as europe-west1';
const LOCATION_PATTERN = /^[a-z]+[0-9]*(-[a-z]+[0-9]+)?$/;

/** Creates the (default) database when the project has none, in a location that can't change later. */
const ensureDatabase = async (
  repoRoot: string,
  projectId: string,
  location: string | undefined,
): Promise<boolean> => {
  const current = await databaseLocation(repoRoot, projectId);
  if (current) {
    console.log(`✔ Firestore database in ${current}.`);
    return true;
  }
  let chosen = location;
  while (!chosen) {
    const answer = await ask(
      `\nWhere to keep the Firestore data, near most visitors: ${LOCATIONS}. It can't change later:`,
      'nam5',
    );
    if (LOCATION_PATTERN.test(answer)) chosen = answer;
    else console.log('  Use a location ID, such as eur3 or europe-west1.');
  }
  try {
    await createDatabase(repoRoot, projectId, chosen);
  } catch (error) {
    console.log(`✘ ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
  console.log(`✔ Created the Firestore database in ${chosen}.`);
  return true;
};

/** The starting content: the sample, none, or an export. */
const chooseContent = async (options: InitOptions): Promise<string | undefined> => {
  if (options.from) return resolve(options.from);
  if (options.seed !== undefined) return options.seed ? 'sample' : undefined;
  for (;;) {
    const answer = await ask(
      '\nStarting content: "sample" for sample speakers and sessions, "empty", or the folder of ' +
        "an export from `hb data export`, such as last year's site:",
      'sample',
    );
    if (answer === 'sample') return answer;
    if (answer === 'empty') return undefined;
    if (existsSync(join(resolve(answer), 'manifest.json'))) return resolve(answer);
    console.log('  Type sample, empty, or a folder with a manifest.json.');
  }
};

const askImages = async (options: InitOptions): Promise<SiteImages> => {
  const image = async (given: string | undefined, question: string) => {
    if (given) return resolve(given);
    for (;;) {
      const answer = await ask(question);
      if (!answer) return undefined;
      if (existsSync(resolve(answer))) return resolve(answer);
      console.log(`  ${resolve(answer)} does not exist.`);
    }
  };
  console.log('\nYour images. Leave one empty to keep the current one.');
  const logo = await image(options.logo, 'Logo, an SVG file:');
  const icon = await image(options.icon, 'Icon, a PNG of at least 512×512 pixels, or an SVG:');
  const shareImage = await image(options.shareImage, 'Image for link previews, a JPEG or PNG:');
  return {
    ...(logo ? { logo } : {}),
    ...(icon ? { icon } : {}),
    ...(shareImage ? { shareImage } : {}),
  };
};

const printBudgetSteps = () => {
  console.log(
    [
      '\nSet a spend cap and a budget, so unexpected traffic cannot run up a bill',
      '(docs/tutorials/02-firebase.md#spend-cap-and-budget). In',
      'https://console.cloud.google.com/billing/budgets, create:',
      '  1. A budget with spend cap enforcement for the Cloud Run service of this project.',
      '  2. A budget for the whole project that only sends email alerts.',
    ].join('\n'),
  );
};

/**
 * Sets up a new site: the Firebase project and web app, the event details in packages/config,
 * the billing checks, and optionally the first deploy and sample content. Safe to re-run: the
 * current config is the default for every answer.
 */
export const runInit = async (options: InitOptions = {}): Promise<boolean> => {
  const repoRoot = findRepoRoot(process.cwd());
  if (!repoRoot) {
    console.log('✘ Could not find the repository root (no ancestor directory contains .git).');
    return false;
  }
  const nodeCheck = checkNodeVersion(repoRoot);
  if (!nodeCheck.ok) {
    console.log(`✘ ${nodeCheck.name}: ${nodeCheck.message}`);
    return false;
  }

  const projects = firebaseProjects(repoRoot);
  if (!projects.signedIn()) {
    console.log('Signing in to Firebase...');
    if (runCommand(resolveFirebaseBin(repoRoot), ['login'], repoRoot) !== 0) return false;
  }

  const siteProjectId = readSiteProjectId(repoRoot);
  let projectId: string;
  let create: boolean;
  try {
    ({ projectId, create } = options.project
      ? { projectId: options.project, create: Boolean(options.create) }
      : await chooseProject(projects, resolveFirebaseProjectId(repoRoot)));
    if (create) {
      console.log(`\nCreating the Firebase project ${projectId}...`);
      projects.create(projectId, projectId);
    }
    if (!projects.webApps(projectId).length) {
      console.log(`Adding a web app to ${projectId}...`);
      projects.createWebApp(projectId, 'Hoverboard');
    }
  } catch (error) {
    console.log(`✘ ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
  console.log(`✔ Firebase project: ${projectId}.`);

  const copied = !existsSync(join(repoRoot, SITE_CONFIG_PATH));
  if (copied) copyDemoConfig(repoRoot);
  const site = readJson(repoRoot, SITE_CONFIG_PATH);
  const resources = readJson(repoRoot, RESOURCES_PATH);
  const defaultFeatures = readJson(repoRoot, DEFAULTS_PATH)['features'] as Record<string, boolean>;
  const features = Object.keys(defaultFeatures);
  const newProject = projectId !== siteProjectId;
  const details: SiteDetails = options.details
    ? (JSON.parse(readFileSync(options.details, 'utf8')) as SiteDetails)
    : await askSiteDetails(
        ask,
        currentDetails({
          site,
          resources,
          features: { ...defaultFeatures, ...(site['features'] as Record<string, boolean>) },
          newProject,
        }),
        projectId,
        features,
        readThemes(repoRoot),
      );

  const updated = applySiteDetails(site, resources, details, {
    projectId,
    newProject,
    features,
    requires: await loadFeatureRequires(repoRoot),
  });
  const featuresOn = updated.site['features'] as Record<string, boolean>;
  // The demo's text describes GDG DevFest Ukraine.
  if (copied) updated.resources = starterResources(updated.resources, details, featuresOn);
  if (!options.details) {
    updated.resources = await askStarterText(ask, updated.resources, featuresOn);
  }
  if (details.resources) updated.resources = mergeText(updated.resources, details.resources);
  const images = options.details
    ? {
        ...(options.logo ? { logo: resolve(options.logo) } : {}),
        ...(options.icon ? { icon: resolve(options.icon) } : {}),
        ...(options.shareImage ? { shareImage: resolve(options.shareImage) } : {}),
      }
    : await askImages(options);
  updated.site = copySiteImages(repoRoot, updated.site, images);
  writeJson(repoRoot, SITE_CONFIG_PATH, updated.site);
  writeJson(repoRoot, RESOURCES_PATH, updated.resources);
  // Lets plain `firebase` commands use the same project as `hb`.
  writeJson(repoRoot, '.firebaserc', { projects: { default: projectId } });
  const prettier = join(repoRoot, 'node_modules', '.bin', 'prettier');
  if (existsSync(prettier)) {
    runCommand(
      prettier,
      ['--log-level', 'warn', '--write', SITE_CONFIG_PATH, RESOURCES_PATH],
      repoRoot,
    );
  }
  console.log(`\n✔ Wrote ${SITE_CONFIG_PATH} and ${RESOURCES_PATH}.`);

  const errors = await validateSiteConfig(repoRoot);
  if (errors.length) {
    for (const error of errors) console.log(`✘ ${error}`);
    console.log('\nFix packages/config, then run `./hb init` again.');
    return false;
  }

  // Without functions, the site runs on the free Spark plan.
  const functions = functionsEnabled(repoRoot);
  const onBlaze = async () => {
    try {
      return await isBillingEnabled(repoRoot, projectId);
    } catch {
      return undefined;
    }
  };
  let billing: boolean | undefined = !functions || undefined;
  if (functions) {
    billing = await onBlaze();
    if (!billing) {
      console.log(
        `\n! ${projectId} ${billing === false ? 'is not' : 'may not be'} on the Blaze plan, ` +
          'which deploying Cloud Functions needs. Upgrade at ' +
          `https://console.firebase.google.com/project/${projectId}/usage/details, ` +
          'or turn off features.functions in packages/config/site.json.',
      );
    }
    printBudgetSteps();
  }

  if (!(await ensureDatabase(repoRoot, projectId, options.location))) return false;

  // Before the deploy, so the first build already has the content. Seeding doesn't need Blaze.
  const content = await chooseContent(options);
  if (content) {
    const exitCode = runCommand(
      process.execPath,
      content === 'sample'
        ? ['hb', 'data', 'seed', '--production', '--yes']
        : ['hb', 'data', 'import', content, '--production', '--yes'],
      repoRoot,
    );
    if (exitCode !== 0) return false;
  }

  // Scheduled backups need Blaze, and are billed for storage.
  let backups = false;
  if (options.backups !== false && (functions ? billing : await onBlaze())) {
    backups =
      options.backups ??
      (await confirm(
        '\nBack up Firestore every day, and keep each backup for 7 days? Backups are billed ' +
          'for storage, a few cents a month for most sites.',
      ));
  }
  if (backups) {
    const exitCode = runCommand(
      process.execPath,
      ['hb', 'backup', 'schedule', '--daily', '--yes'],
      repoRoot,
    );
    if (exitCode !== 0) return false;
  }

  const deploy = billing && (options.deploy ?? (await confirm('\nBuild and deploy the site now?')));
  if (deploy && !(await runDeploy({ yes: true }))) return false;

  const repository = await setUpRepository(repoRoot, {
    ...(options.repo !== undefined ? { repo: options.repo } : {}),
    shortName: details.shortName,
  });

  console.log('\nChecking the setup:');
  await runDoctor();

  const consoleUrl = `https://console.firebase.google.com/project/${projectId}`;
  console.log(
    [
      `\nSite: ${details.url ?? defaultUrl(projectId)}${deploy ? '' : ', after the first deploy'}`,
      `Content: ${consoleUrl}/firestore/databases/-default-/data`,
      `Project: ${consoleUrl}/overview`,
      '\nNext:',
      ...(deploy ? [] : ['  - Deploy with `./hb deploy`.']),
      ...(content
        ? []
        : [
            '  - Add content in the Firebase console, or the sample content with ' +
              '`./hb data seed --production`.',
          ]),
      '  - Content edits show in the browser at once, and in the built pages after the next deploy.',
      `  - Edit the rest of the text in ${RESOURCES_PATH}, and the FAQ and code of conduct next to it.`,
      ...(copied
        ? [
            `  - Replace the demo's photos, videos and links in ${RESOURCES_PATH}, and the ` +
              `images in ${CONFIG_DIR}/public/images.`,
          ]
        : []),
      ...(backups ? [] : ['  - Schedule backups with `./hb backup schedule --daily`.']),
      ...(repository.pushed
        ? []
        : [
            `  - Commit ${CONFIG_DIR}, and run \`./hb setup-github\` so GitHub Actions deploys ` +
              'every push to main.',
          ]),
    ].join('\n'),
  );
  return repository.ok;
};
