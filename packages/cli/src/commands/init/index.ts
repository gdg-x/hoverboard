import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { isBillingEnabled } from '../../lib/billing.js';
import { resolveFirebaseBin } from '../../lib/firebase-cli.js';
import { ask, confirm } from '../../lib/prompt.js';
import { runCommand } from '../../lib/spawn.js';
import { SITE_CONFIG_PATH, resolveFirebaseProjectId } from '../../utils/firebase-project.js';
import { checkNodeVersion, findRepoRoot } from '../../utils/node-version.js';
import { validateSiteConfig } from '../../utils/site-config.js';
import { functionsEnabled } from '../../utils/site-features.js';
import { runDeploy } from '../deploy.js';
import { type FirebaseProjects, firebaseProjects } from './firebase-projects.js';
import {
  PROJECT_ID_PATTERN,
  type SiteDetails,
  applySiteDetails,
  askSiteDetails,
  currentDetails,
} from './site-details.js';

export interface InitOptions {
  /** The Firebase project. Without it, the wizard lists the account's projects. */
  project?: string;
  /** Create `project` instead of using an existing one. */
  create?: boolean;
  /** A JSON file with the site details, instead of asking for them. */
  details?: string;
  /** Deploy without asking, or with `false`, skip it. */
  deploy?: boolean;
  /** Add the sample content without asking, or with `false`, skip it. */
  seed?: boolean;
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
  const firebase = (readJson(repoRoot, SITE_CONFIG_PATH)['firebase'] ?? {}) as Json;
  return typeof firebase['projectId'] === 'string' ? firebase['projectId'] : undefined;
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
  writeJson(repoRoot, SITE_CONFIG_PATH, updated.site);
  writeJson(repoRoot, RESOURCES_PATH, updated.resources);
  // Lets plain `firebase` commands use the same project as `hbd`.
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
    console.log('\nFix packages/config, then run `./hbd init` again.');
    return false;
  }

  // Without functions, the site runs on the free Spark plan.
  const functions = functionsEnabled(repoRoot);
  let billing: boolean | undefined = !functions || undefined;
  if (functions) {
    try {
      billing = await isBillingEnabled(repoRoot, projectId);
    } catch {
      billing = undefined;
    }
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

  // Before the deploy, so the first build already has the content. Seeding doesn't need Blaze.
  const seed =
    options.seed ??
    (await confirm(
      'Add the sample speakers and sessions to Firestore? You can edit or delete them in the ' +
        'Firebase console later.',
    ));
  if (seed) {
    const exitCode = runCommand(
      'npm',
      ['--prefix', 'packages/cli', 'run', 'firestore-init:production'],
      repoRoot,
    );
    if (exitCode !== 0) return false;
  }

  const deploy = billing && (options.deploy ?? (await confirm('\nBuild and deploy the site now?')));
  if (deploy && !(await runDeploy({ yes: true }))) return false;

  console.log(
    [
      '\nNext:',
      ...(deploy ? [] : ['  - Deploy with `./hbd deploy`.']),
      ...(seed
        ? []
        : [
            '  - Add content in the Firebase console, or the sample content with ' +
              '`npm run firestore:init:production`.',
          ]),
      '  - Content edits show in the browser at once, and in the built pages after the next deploy.',
      `  - Edit the rest of the text in ${RESOURCES_PATH}, and the FAQ and code of conduct next to it.`,
      '  - Run `./hbd setup-github` so GitHub Actions deploys every push to main.',
    ].join('\n'),
  );
  return true;
};
