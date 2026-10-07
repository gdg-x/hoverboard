import { createRequire } from 'module';
import { join } from 'path';

export type HttpMethod = 'GET' | 'POST' | 'PATCH';

/** Calls Google Cloud REST APIs. Errors carry the HTTP status in `status`. */
export interface GoogleCloud {
  request<T>(method: HttpMethod, url: string, body?: unknown): Promise<T>;
}

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

interface FirebaseToolsClient {
  request: (options: {
    method: HttpMethod;
    path: string;
    queryParams?: URLSearchParams;
    body?: unknown;
    headers?: Record<string, string>;
  }) => Promise<{ body: unknown }>;
}

interface FirebaseToolsApiV2 {
  Client: new (options: { urlPrefix: string; auth: boolean }) => FirebaseToolsClient;
}

/**
 * A Google Cloud client signed in as the Firebase CLI's current account, so organizers need
 * `firebase login` but not gcloud. firebase-tools has no public API for this, so it reuses the
 * internal client that `firebase deploy` uses.
 */
export const createGoogleCloud = async (
  repoRoot: string,
  projectId: string,
): Promise<GoogleCloud> => {
  const requireFromRoot = createRequire(join(repoRoot, 'package.json'));
  const auth = requireFromRoot('firebase-tools/lib/auth.js') as FirebaseToolsAuth;
  const { requireAuth } = requireFromRoot(
    'firebase-tools/lib/requireAuth.js',
  ) as FirebaseToolsRequireAuth;
  const { Client } = requireFromRoot('firebase-tools/lib/apiv2.js') as FirebaseToolsApiV2;

  const options: Options = { project: projectId, projectRoot: repoRoot };
  const account = auth.selectAccount(undefined, repoRoot);
  if (account) {
    auth.setActiveAccount(options, account);
  } else if (!process.env['GOOGLE_APPLICATION_CREDENTIALS']) {
    throw new Error('Not logged in to Firebase. Run `firebase login`.');
  }
  await requireAuth(options);

  return {
    async request<T>(method: HttpMethod, url: string, body?: unknown): Promise<T> {
      const { origin, pathname, searchParams } = new URL(url);
      const client = new Client({ urlPrefix: origin, auth: true });
      const response = await client.request({
        method,
        path: pathname,
        queryParams: searchParams,
        body,
        headers: { 'x-goog-user-project': projectId },
      });
      return response.body as T;
    },
  };
};
