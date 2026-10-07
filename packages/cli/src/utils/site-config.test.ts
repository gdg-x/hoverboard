import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkSiteConfig, validateSiteConfig } from './site-config.js';

const repoRoot = join(import.meta.dirname, '..', '..', '..', '..');
const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('validateSiteConfig', () => {
  it('finds no errors in the repository config', async () => {
    await expect(validateSiteConfig(repoRoot)).resolves.toEqual([]);
  });
});

describe('checkSiteConfig', () => {
  it('passes for the repository config', async () => {
    await expect(checkSiteConfig(repoRoot)).resolves.toEqual({
      name: 'Site config',
      ok: true,
      message: 'packages/config is valid.',
    });
  });

  it('skips without packages/web', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
    dirsToClean.push(dir);

    await expect(checkSiteConfig(dir)).resolves.toMatchObject({ ok: true, warning: true });
  });
});
