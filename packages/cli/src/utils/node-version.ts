import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

export interface DoctorCheckResult {
  name: string;
  ok: boolean;
  /** Printed as a warning; doesn't fail the run. */
  warning?: boolean;
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
 * Reads the major Node.js version from `engines.node` in the repo root's
 * `package.json`, the same field CI's `actions/setup-node` reads.
 */
export const requiredNodeMajorVersion = (repoRoot: string): number | undefined => {
  const packageJsonPath = join(repoRoot, 'package.json');
  if (!existsSync(packageJsonPath)) return undefined;
  try {
    const { engines } = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      engines?: { node?: string };
    };
    const match = engines?.node?.match(/(\d+)/);
    return match ? Number(match[1]) : undefined;
  } catch {
    return undefined;
  }
};

export const checkNodeVersion = (repoRoot: string | undefined): DoctorCheckResult => {
  const required = repoRoot && requiredNodeMajorVersion(repoRoot);
  const runningMajor = Number(process.version.slice(1).split('.')[0]);

  if (!required) {
    return {
      name: 'Node.js version',
      ok: false,
      message: `Could not determine the required Node.js version (no engines.node in package.json). Running ${process.version}.`,
    };
  }

  if (runningMajor !== required) {
    return {
      name: 'Node.js version',
      ok: false,
      message: `Expected Node.js ${required}.x (see engines.node in package.json), but running ${process.version}. Run \`nvm install ${required}\`.`,
    };
  }

  return {
    name: 'Node.js version',
    ok: true,
    message: `Running Node.js ${process.version}, matching the required v${required}.`,
  };
};
