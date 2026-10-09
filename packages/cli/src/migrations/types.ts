export interface FirestoreDocument {
  path: string;
  /** The data as JSON, as the schema reads it. Undefined for a document that doesn't exist. */
  data: Record<string, unknown> | undefined;
  /** The data as Firestore returns it, with its timestamps and references. */
  raw?: Record<string, unknown> | undefined;
  /** When the document last changed, so a write can check it hasn't changed since. */
  updateTime?: unknown;
}

export interface MigrationPlan {
  /** Changes to existing documents, by top-level field. `DELETE` from lib/fixes removes one. */
  updates: { path: string; fields: Record<string, unknown> }[];
  /** New documents, which must not exist yet. */
  creates: { path: string; data: Record<string, unknown> }[];
  /** Documents to copy to a new path, then delete. */
  moves?: { from: string; to: string }[];
  /** A change to packages/config/site.json. */
  site?: (site: Record<string, unknown>) => Record<string, unknown>;
  /** What the migration changes, one line each. */
  lines: string[];
  /** What a person should check afterwards. */
  warnings: string[];
}

export interface Migration {
  /** The release it ships in and a name, such as `4.0.0-schedule-on-sessions`. */
  id: string;
  description: string;
  /** Retired collections it reads, which must not be deleted before it runs. */
  reads: string[];
  /** Why the data still needs the migration, or undefined when it doesn't. */
  pending: (documents: FirestoreDocument[]) => string | undefined;
  plan: (documents: FirestoreDocument[]) => MigrationPlan;
}
