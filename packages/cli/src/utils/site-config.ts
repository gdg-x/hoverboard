import { existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import type { DoctorCheckResult } from './node-version.js';

interface ResolveConfigModule {
  configPaths: (webRoot: string) => unknown;
  loadConfig: (options: { paths: unknown; nodeEnv: string }) => { errors: string[] };
}

const resolveConfigPath = (repoRoot: string) =>
  join(repoRoot, 'packages', 'web', 'build', 'resolve-config.ts');

/** Validates packages/config with the same code the web build runs, and returns every error. */
export const validateSiteConfig = async (repoRoot: string): Promise<string[]> => {
  const module = (await import(
    pathToFileURL(resolveConfigPath(repoRoot)).href
  )) as ResolveConfigModule;
  const paths = module.configPaths(join(repoRoot, 'packages', 'web'));
  return module.loadConfig({ paths, nodeEnv: 'production' }).errors;
};

const name = 'Site config';

export const checkSiteConfig = async (repoRoot: string | undefined): Promise<DoctorCheckResult> => {
  if (!repoRoot || !existsSync(resolveConfigPath(repoRoot))) {
    return { name, ok: true, warning: true, message: 'Skipped, packages/web was not found.' };
  }
  try {
    const errors = await validateSiteConfig(repoRoot);
    if (!errors.length) {
      return { name, ok: true, message: 'packages/config is valid.' };
    }
    return {
      name,
      ok: false,
      message: `packages/config has ${errors.length} error(s):\n${errors.map((error) => `    ${error}`).join('\n')}`,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      message: `Could not read packages/config: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
