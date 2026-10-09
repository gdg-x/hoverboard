import { describe, expect, it } from 'vitest';
import site from '../../../config/site.json';
import { CONFIG_MIGRATIONS, schemaVersionAfter } from './config.js';

describe('CONFIG_MIGRATIONS', () => {
  it('are one version apart, from 2', () => {
    expect(CONFIG_MIGRATIONS.map(({ version }) => version)).toEqual(
      CONFIG_MIGRATIONS.map((_, index) => index + 2),
    );
  });

  it('leave site.json at its current schemaVersion', () => {
    expect(site.schemaVersion).toBe(schemaVersionAfter(CONFIG_MIGRATIONS));
  });
});
