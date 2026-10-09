import { execFileSync } from 'node:child_process';

export interface BuildInfo {
  /** The short commit SHA. Missing outside a git checkout. */
  sha?: string;
  /** When the build started, in ISO 8601. */
  time: string;
}

const shortSha = (cwd: string): string | undefined => {
  try {
    const sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return sha || undefined;
  } catch {
    return undefined;
  }
};

/** The commit and time of this build, which the footer shows. */
export const buildInfo = (cwd = process.cwd(), now = new Date()): BuildInfo => {
  const sha = shortSha(cwd);
  return { ...(sha ? { sha } : {}), time: now.toISOString() };
};
