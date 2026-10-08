import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { missingXliffErrors, siteTargetLocales } from './localize-build.mjs';

const dirsToClean: string[] = [];

afterEach(() => {
  for (const dir of dirsToClean.splice(0)) rmSync(dir, { recursive: true, force: true });
});

const siteDir = (site: object) => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-site-'));
  dirsToClean.push(dir);
  writeFileSync(join(dir, 'site.json'), JSON.stringify(site));
  return dir;
};

describe('siteTargetLocales', () => {
  it('builds no locales for the repository config', () => {
    expect(siteTargetLocales()).toEqual([]);
  });

  it('builds no locales when the site does not set them', () => {
    expect(siteTargetLocales(siteDir({}))).toEqual([]);
  });

  it('builds the source and target locales except en', () => {
    const dir = siteDir({ locales: { source: 'es', targets: ['en', 'pt-BR', 'es'] } });

    expect(siteTargetLocales(dir)).toEqual(['es', 'pt-BR']);
  });
});

describe('missingXliffErrors', () => {
  it('reports locales without UI translations', () => {
    expect(missingXliffErrors(['es'])).toEqual([
      'es: site.json lists it in locales, but packages/translations/xliff/es.xlf does not exist.',
    ]);
  });

  it('rejects codes that are not locales before reading files', () => {
    expect(missingXliffErrors(['../source/en'])).toEqual([
      'site.json/locales: "../source/en" is not a locale code.',
    ]);
  });

  it('accepts no locales', () => {
    expect(missingXliffErrors([])).toEqual([]);
  });
});
