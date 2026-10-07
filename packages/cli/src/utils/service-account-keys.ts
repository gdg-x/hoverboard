import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { DoctorCheckResult } from './node-version.js';

const name = 'Service account keys';

const isServiceAccountKey = (path: string): boolean => {
  try {
    const json = JSON.parse(readFileSync(path, 'utf8')) as { type?: unknown };
    return json.type === 'service_account';
  } catch {
    return false;
  }
};

/** Warns about key files in the repository root, which Hoverboard no longer uses. */
export const checkServiceAccountKeys = (repoRoot: string | undefined): DoctorCheckResult => {
  if (!repoRoot) {
    return { name, ok: true, warning: true, message: 'Skipped, no repository root found.' };
  }

  const keys = readdirSync(repoRoot).filter(
    (file) =>
      file === 'serviceAccount.json' ||
      /-adminsdk-.*\.json$/.test(file) ||
      (file.endsWith('.json') && isServiceAccountKey(join(repoRoot, file))),
  );
  if (!keys.length) {
    return { name, ok: true, message: 'No service account key files in the repository root.' };
  }
  return {
    name,
    ok: true,
    warning: true,
    message:
      `Found ${keys.join(', ')}. Hoverboard signs in with \`firebase login\` and no longer uses ` +
      'key files. Delete them and revoke the keys in the Google Cloud console under IAM > ' +
      'Service accounts.',
  };
};
