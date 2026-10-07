import { createRequire } from 'module';
import { join } from 'path';

interface Account {
  user: { email: string };
  tokens: unknown;
}

type Options = Record<string, unknown>;

interface FirebaseToolsAuth {
  selectAccount: (account: string | undefined, projectRoot: string) => Account | undefined;
  setActiveAccount: (options: Options, account: Account) => void;
}

interface FirebaseToolsRequireAuth {
  requireAuth: (options: Options) => Promise<unknown>;
}

interface FirebaseToolsCloudBilling {
  checkBillingEnabled: (projectId: string) => Promise<boolean>;
}

/**
 * Checks whether billing (the Blaze plan) is enabled for a project, signed in
 * as the Firebase CLI's current account. firebase-tools has no public API for
 * this, so it reuses the internal helpers `firebase deploy` uses; callers
 * should treat any error as "unknown".
 */
export const isBillingEnabled = async (repoRoot: string, projectId: string): Promise<boolean> => {
  const requireFromRoot = createRequire(join(repoRoot, 'package.json'));
  const auth = requireFromRoot('firebase-tools/lib/auth.js') as FirebaseToolsAuth;
  const { requireAuth } = requireFromRoot(
    'firebase-tools/lib/requireAuth.js',
  ) as FirebaseToolsRequireAuth;
  const { checkBillingEnabled } = requireFromRoot(
    'firebase-tools/lib/gcp/cloudbilling.js',
  ) as FirebaseToolsCloudBilling;

  const options: Options = { project: projectId, projectRoot: repoRoot };
  const account = auth.selectAccount(undefined, repoRoot);
  if (account) {
    auth.setActiveAccount(options, account);
  } else if (!process.env['GOOGLE_APPLICATION_CREDENTIALS']) {
    throw new Error('Not logged in to Firebase. Run `firebase login`.');
  }

  await requireAuth(options);
  // Like `firebase deploy`, this enables the Cloud Billing API on the project if needed.
  return checkBillingEnabled(projectId);
};
