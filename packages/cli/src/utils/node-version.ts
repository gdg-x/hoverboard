import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

export interface DoctorCheckResult {
  name: string;
  ok: boolean;
  message: string;
}

/**
 * Walks up from `startDir` looking for a directory containing `.git`, which
 * marks the repository root regardless of which package the CLI is invoked
 * from or moved into later.
 */
export const findRepoRoot = (startDir: string): string | undefined => {
  let dir = startDir;
  for (;;) {
    if (existsSync(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
};

/**
 * Reads the major Node.js version pinned in the repo root's `.nvmrc`, the
 * same file `nvm`/`fnm`/CI use to select a Node version.
 */
export const requiredNodeMajorVersion = (repoRoot: string): number | undefined => {
  const nvmrcPath = join(repoRoot, '.nvmrc');
  if (!existsSync(nvmrcPath)) return undefined;
  const match = readFileSync(nvmrcPath, 'utf8')
    .trim()
    .match(/^v?(\d+)/);
  return match ? Number(match[1]) : undefined;
};

export const checkNodeVersion = (repoRoot: string | undefined): DoctorCheckResult => {
  const required = repoRoot && requiredNodeMajorVersion(repoRoot);
  const runningMajor = Number(process.version.slice(1).split('.')[0]);

  if (!required) {
    return {
      name: 'Node.js version',
      ok: false,
      message: `Could not determine the required Node.js version (no .nvmrc found). Running ${process.version}.`,
    };
  }

  if (runningMajor !== required) {
    return {
      name: 'Node.js version',
      ok: false,
      message: `Expected Node.js ${required}.x (see .nvmrc), but running ${process.version}. Run \`nvm use\`.`,
    };
  }

  return {
    name: 'Node.js version',
    ok: true,
    message: `Running Node.js ${process.version}, matching the required v${required}.`,
  };
};
