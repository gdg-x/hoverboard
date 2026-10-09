export type SiteConfig = Record<string, unknown>;

export interface ConfigMigration {
  /** The `schemaVersion` it moves site.json to. */
  version: number;
  description: string;
  migrate: (site: SiteConfig) => SiteConfig;
}

/** Every site.json migration, oldest first, one version apart. */
export const CONFIG_MIGRATIONS: ConfigMigration[] = [];

/** The `schemaVersion` of site.json after the migrations. */
export const schemaVersionAfter = (migrations: ConfigMigration[]) =>
  migrations.at(-1)?.version ?? 1;
