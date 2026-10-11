import { applicationDefault, deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { useFirebaseLoginCredentials } from './google-cloud.js';

/** Deletes every Auth user of a project, as an archived edition no one signs in to. */
export const deleteAllUsers = async (repoRoot: string, projectId: string): Promise<number> => {
  await useFirebaseLoginCredentials(repoRoot);
  const app = initializeApp({ credential: applicationDefault(), projectId }, `users-${projectId}`);
  try {
    const auth = getAuth(app);
    let deleted = 0;
    for (;;) {
      const { users } = await auth.listUsers(1000);
      if (!users.length) return deleted;
      const result = await auth.deleteUsers(users.map(({ uid }) => uid));
      deleted += result.successCount;
      if (result.failureCount) {
        throw new Error(
          `${result.failureCount} users weren't deleted: ${result.errors[0]?.error.message}`,
        );
      }
    }
  } finally {
    await deleteApp(app);
  }
};
