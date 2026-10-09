import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

type Features = Record<string, boolean>;

const readFeatures = (path: string): Features =>
  existsSync(path)
    ? ((JSON.parse(readFileSync(path, 'utf8')) as { features?: Features }).features ?? {})
    : {};

/** The `features` of packages/config/site.json over the upstream defaults. */
export const siteFeatures = (repoRoot: string): Features => ({
  ...readFeatures(join(repoRoot, 'packages', 'web', 'defaults', 'site.json')),
  ...readFeatures(join(repoRoot, 'packages', 'config', 'site.json')),
});

/** Whether the site deploys Cloud Functions. Without `features.functions`, it does. */
export const functionsEnabled = (repoRoot: string): boolean =>
  siteFeatures(repoRoot)['functions'] !== false;

/** The arguments `firebase deploy` needs for the site, besides the project. */
export const firebaseDeployArgs = (repoRoot: string): string[] =>
  functionsEnabled(repoRoot) ? [] : ['--except', 'functions'];
