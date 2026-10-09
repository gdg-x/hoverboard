import { firebaseToolsSession } from './billing.js';

export interface DeployedFunction {
  id: string;
  region: string;
  /** `gcfv2` for 2nd gen, `gcfv1` for 1st gen, or `run`. */
  platform: string;
}

interface FirebaseToolsBackend {
  existingBackend: (context: { projectId: string }) => Promise<unknown>;
  allEndpoints: (backend: unknown) => DeployedFunction[];
}

/** The Cloud Functions deployed to a project, as `firebase functions:list` finds them. */
export const listDeployedFunctions = async (
  repoRoot: string,
  projectId: string,
): Promise<DeployedFunction[]> => {
  const requireFromRoot = await firebaseToolsSession(repoRoot, projectId);
  const backend = requireFromRoot(
    'firebase-tools/lib/deploy/functions/backend.js',
  ) as FirebaseToolsBackend;
  const existing = await backend.existingBackend({ projectId });
  return backend
    .allEndpoints(existing)
    .map(({ id, region, platform }) => ({ id, region, platform }));
};
