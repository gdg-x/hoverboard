import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    fakeLocale: string;
  }
}

const FAKE_LOCALE = 'en-XA';
const webRoot = fileURLToPath(new URL('..', import.meta.url));
// The `Smoke (fake locale)` project points `src/utils/localization.ts` here instead of `locales/`.
const fakeLocalesDir = join(webRoot, 'src/generated/test-locales');

/** Wraps every message in brackets and keeps its placeholders, so translated text is easy to spot. */
export const pseudoTranslate = (sourceXml: string, locale: string): string =>
  sourceXml
    .replace('<file ', `<file target-language="${locale}" `)
    .replace(/<source>([\s\S]*?)<\/source>/g, '<source>$1</source><target>[$1]</target>');

/** Builds a pseudo-translated locale from `source/en.xlf` with `lit-localize build`. */
export default function setup({ provide }: TestProject): void {
  const config = JSON.parse(readFileSync(join(webRoot, 'lit-localize.json'), 'utf8'));
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-fake-locale-'));
  try {
    const source = readFileSync(join(webRoot, '../translations/source/en.xlf'), 'utf8');
    writeFileSync(join(dir, `${FAKE_LOCALE}.xlf`), pseudoTranslate(source, FAKE_LOCALE));
    const configPath = join(dir, 'lit-localize.json');
    writeFileSync(
      configPath,
      JSON.stringify({
        ...config,
        targetLocales: [FAKE_LOCALE],
        inputFiles: config.inputFiles.map((pattern: string) =>
          pattern.startsWith('!')
            ? `!${resolve(webRoot, pattern.slice(1))}`
            : resolve(webRoot, pattern),
        ),
        output: { mode: 'runtime', language: 'ts', outputDir: fakeLocalesDir },
        interchange: { format: 'xliff', xliffDir: dir },
      }),
    );
    rmSync(fakeLocalesDir, { recursive: true, force: true });
    execFileSync(
      process.execPath,
      [
        join(webRoot, 'node_modules/@lit/localize-tools/bin/lit-localize.js'),
        'build',
        `--config=${configPath}`,
      ],
      { stdio: 'pipe' },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  provide('fakeLocale', FAKE_LOCALE);
}
