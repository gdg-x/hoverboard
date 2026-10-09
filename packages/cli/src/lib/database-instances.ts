import { firebaseToolsSession } from './billing.js';

export interface DatabaseInstance {
  name: string;
  location: string;
  /** `ACTIVE`, `DISABLED` or `DELETED`. */
  state: string;
}

interface FirebaseToolsDatabase {
  listDatabaseInstances: (projectId: string, location: string) => Promise<DatabaseInstance[]>;
}

/** The project's Realtime Database instances, as `firebase database:instances:list` finds them. */
export const listDatabaseInstances = async (
  repoRoot: string,
  projectId: string,
): Promise<DatabaseInstance[]> => {
  const requireFromRoot = await firebaseToolsSession(repoRoot, projectId);
  const database = requireFromRoot(
    'firebase-tools/lib/management/database.js',
  ) as FirebaseToolsDatabase;
  // `-` lists every location.
  const instances = await database.listDatabaseInstances(projectId, '-');
  return instances.map(({ name, location, state }) => ({ name, location, state }));
};
