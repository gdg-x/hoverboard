import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Resolves firebase-tools' CLI binary from the repo root's own node_modules,
 * since packages/cli intentionally doesn't depend on the (large)
 * firebase-tools package itself.
 */
export const resolveFirebaseBin = (repoRoot: string): string => {
  const binName = process.platform === 'win32' ? 'firebase.cmd' : 'firebase';
  const bin = join(repoRoot, 'node_modules', '.bin', binName);
  if (!existsSync(bin)) {
    throw new Error(`firebase-tools not found at ${bin}. Run \`npm ci\` at the repo root first.`);
  }
  return bin;
};
