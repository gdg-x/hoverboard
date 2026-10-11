import { spawnSync } from 'child_process';

export interface GitResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** Runs git without a terminal, and returns its output. */
export const git = (cwd: string, args: string[]): GitResult => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', env: process.env });
  if (result.error) throw result.error;
  return { status: result.status ?? 1, stdout: result.stdout, stderr: result.stderr };
};

/** Runs git, and returns its trimmed output. Throws with git's message when it fails. */
export const gitOutput = (cwd: string, args: string[]): string => {
  const { status, stdout, stderr } = git(cwd, args);
  if (status !== 0) {
    throw new Error(`git ${args[0]} failed: ${(stderr || stdout).trim()}`);
  }
  return stdout.trim();
};

/** A file at a commit, or undefined when the commit doesn't have it. */
export const fileAt = (cwd: string, commit: string, path: string): string | undefined => {
  const { status, stdout } = git(cwd, ['show', `${commit}:${path}`]);
  return status === 0 ? stdout : undefined;
};

export const lines = (output: string): string[] => output.split('\n').filter(Boolean);
