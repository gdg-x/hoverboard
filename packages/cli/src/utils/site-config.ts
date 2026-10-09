import { existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import type { DoctorCheckResult } from './node-version.js';

interface ResolveConfigModule {
  ConfigError: new (errors: string[]) => Error & { errors: string[] };
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
  try {
    return module.loadConfig({ paths, nodeEnv: 'production' }).errors;
  } catch (error) {
    if (error instanceof module.ConfigError) return error.errors;
    throw error;
  }
};

export const escapeAnnotation = (text: string) =>
  text.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');

/**
 * Formats a config error as a GitHub Actions workflow command, so it shows on the file in the
 * pull request. Errors start with their path in packages/config.
 */
export const githubAnnotation = (error: string): string => {
  const file = /^([\w./-]+?\.(?:json|md))[/:]/.exec(error)?.[1];
  const position = /\(line (\d+) column (\d+)\)/.exec(error);
  const properties = [
    'title=Site config',
    ...(file ? [`file=packages/config/${file}`] : []),
    ...(position ? [`line=${position[1]}`, `col=${position[2]}`] : []),
  ];
  return `::error ${properties.join(',')}::${escapeAnnotation(error)}`;
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
