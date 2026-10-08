import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkSiteConfig, githubAnnotation, validateSiteConfig } from './site-config.js';

const repoRoot = join(import.meta.dirname, '..', '..', '..', '..');
const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('validateSiteConfig', () => {
  it('finds no errors in the repository config', async () => {
    await expect(validateSiteConfig(repoRoot)).resolves.toEqual([]);
  });

  it('reports a file with invalid JSON as an error', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'hoverboard-cli-'));
    dirsToClean.push(dir);
    mkdirSync(join(dir, 'packages', 'config'), { recursive: true });
    symlinkSync(join(repoRoot, 'packages', 'web'), join(dir, 'packages', 'web'));
    writeFileSync(join(dir, 'packages', 'config', 'site.json'), '{\n  "shortName": DevFest\n}\n');

    const errors = await validateSiteConfig(dir);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/^site\.json: is not valid JSON\. Unexpected token 'D'[^\n]+$/);
  });
});

describe('githubAnnotation', () => {
  it('points at the file in packages/config', () => {
    expect(githubAnnotation('site.json/event/timezone: "Mars" is not a known time zone')).toBe(
      '::error title=Site config,file=packages/config/site.json::site.json/event/timezone: "Mars" is not a known time zone',
    );
    expect(githubAnnotation('content/resources.json: must NOT have additional properties')).toBe(
      '::error title=Site config,file=packages/config/content/resources.json::content/resources.json: must NOT have additional properties',
    );
  });

  it('adds the line and column of a JSON syntax error', () => {
    expect(
      githubAnnotation('site.json: is not valid JSON. Unexpected token (line 2 column 16)'),
    ).toBe(
      '::error title=Site config,file=packages/config/site.json,line=2,col=16::site.json: is not valid JSON. Unexpected token (line 2 column 16)',
    );
  });

  it('leaves out the file when the error is not about one', () => {
    expect(githubAnnotation('content/locales/es: "es" is not in site.json/locales/targets')).toBe(
      '::error title=Site config::content/locales/es: "es" is not in site.json/locales/targets',
    );
  });

  it('escapes percent signs and new lines', () => {
    expect(githubAnnotation('Not in a Hoverboard repo.\n100%')).toBe(
      '::error title=Site config::Not in a Hoverboard repo.%0A100%25',
    );
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
