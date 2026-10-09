import type { FirestoreDocument } from './types.js';
import { scheduleOnSessions } from './4.0.0-schedule-on-sessions.js';
import { signUpIds } from './4.0.0-sign-up-ids.js';

export type { FirestoreDocument, Migration, MigrationPlan } from './types.js';

/** Every data migration, oldest first. */
export const MIGRATIONS = [scheduleOnSessions, signUpIds];

/**
 * The migrations the data still needs, with what shows it. The data decides, not
 * `config/migrations`, so a migration runs again after a restore from an old export.
 */
export const pendingMigrations = (documents: FirestoreDocument[]) =>
  MIGRATIONS.flatMap((migration) => {
    const reason = migration.pending(documents);
    return reason ? [{ migration, reason }] : [];
  });
