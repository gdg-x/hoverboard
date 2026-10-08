import { resolveFirebaseBin } from '../../lib/firebase-cli.js';
import { captureCommand } from '../../lib/spawn.js';

export interface FirebaseProject {
  projectId: string;
  displayName?: string;
}

export interface FirebaseProjects {
  signedIn(): boolean;
  list(): FirebaseProject[];
  create(projectId: string, displayName: string): void;
  /** The display names of the project's web apps. */
  webApps(projectId: string): string[];
  createWebApp(projectId: string, displayName: string): void;
}

interface CliResult<T> {
  status?: string;
  result?: T;
  error?: string;
}

/** Firebase CLI calls, with `--json` output, signed in as the CLI's current account. */
export const firebaseProjects = (repoRoot: string): FirebaseProjects => {
  const bin = resolveFirebaseBin(repoRoot);
  const run = <T>(args: string[]): T => {
    const { status, stdout, stderr } = captureCommand(bin, [...args, '--json'], repoRoot);
    let output: CliResult<T> = {};
    try {
      output = JSON.parse(stdout) as CliResult<T>;
    } catch {
      // The CLI prints JSON on success and on most errors. Anything else is in stderr.
    }
    if (status !== 0 || output.status !== 'success') {
      throw new Error(output.error || stderr.trim() || `firebase ${args[0]} failed.`);
    }
    return output.result as T;
  };

  return {
    signedIn: () => run<unknown[]>(['login:list']).length > 0,
    list: () => run<FirebaseProject[]>(['projects:list']),
    create: (projectId, displayName) => {
      run(['projects:create', projectId, '--display-name', displayName]);
    },
    webApps: (projectId) =>
      run<{ displayName?: string; appId: string }[]>([
        'apps:list',
        'WEB',
        '--project',
        projectId,
      ]).map(({ displayName, appId }) => displayName || appId),
    createWebApp: (projectId, displayName) => {
      run(['apps:create', 'WEB', displayName, '--project', projectId]);
    },
  };
};
