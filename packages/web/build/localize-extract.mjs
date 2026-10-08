// Writes packages/translations/source/en.xlf, the source catalog that Crowdin translates.
// With --check, it fails instead when that file is out of date or a target locale in
// lit-localize.json has untranslated messages.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const translationsRoot = resolve(webRoot, '../translations');
export const sourcePath = join(translationsRoot, 'source/en.xlf');
const cli = join(webRoot, 'node_modules/@lit/localize-tools/bin/lit-localize.js');
const config = JSON.parse(readFileSync(join(webRoot, 'lit-localize.json'), 'utf8'));

const absolute = (pattern) => {
  const negated = pattern.startsWith('!');
  const path = resolve(webRoot, negated ? pattern.slice(1) : pattern)
    .split(sep)
    .join('/');
  return negated ? `!${path}` : path;
};

/**
 * `lit-localize extract` only writes target locales, so this extracts to a placeholder locale in a
 * temporary directory and turns the result into the source catalog. Crowdin's files in xliff/ are
 * never touched.
 */
export const extractSource = () => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-localize-'));
  try {
    const configPath = join(dir, 'lit-localize.json');
    const extractConfig = {
      ...config,
      targetLocales: ['x-source'],
      inputFiles: config.inputFiles.map(absolute),
      interchange: { ...config.interchange, xliffDir: dir },
    };
    writeFileSync(configPath, JSON.stringify(extractConfig));
    execFileSync(process.execPath, [cli, 'extract', `--config=${configPath}`], { stdio: 'pipe' });
    return readFileSync(join(dir, 'x-source.xlf'), 'utf8').replace(
      ' target-language="x-source"',
      '',
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const UNIT = /<trans-unit\b[^>]*\bid="([^"]*)"[^>]*>([\s\S]*?)<\/trans-unit>/g;

/** IDs of messages in the source catalog that have no `<target>` in a locale's XLIFF. */
export const untranslated = (sourceXml, localeXml) => {
  const translated = new Set(
    [...localeXml.matchAll(UNIT)]
      .filter(([, , body]) => body.includes('<target'))
      .map(([, id]) => id),
  );
  return [...sourceXml.matchAll(UNIT)].map(([, id]) => id).filter((id) => !translated.has(id));
};

export const checkErrors = (source) => {
  const errors = [];
  if (!existsSync(sourcePath) || readFileSync(sourcePath, 'utf8') !== source) {
    errors.push(
      'packages/translations/source/en.xlf is out of date. Run `npm --prefix packages/web run localize:extract` and commit it.',
    );
  }
  for (const locale of config.targetLocales) {
    const path = join(translationsRoot, 'xliff', `${locale}.xlf`);
    if (!existsSync(path)) {
      errors.push(`${locale}: packages/translations/xliff/${locale}.xlf is missing.`);
      continue;
    }
    const missing = untranslated(source, readFileSync(path, 'utf8'));
    if (missing.length) errors.push(`${locale}: untranslated messages ${missing.join(', ')}`);
  }
  return errors;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = extractSource();
  if (process.argv.includes('--check')) {
    const errors = checkErrors(source);
    for (const error of errors) console.error(error);
    process.exitCode = errors.length ? 1 : 0;
  } else {
    mkdirSync(dirname(sourcePath), { recursive: true });
    writeFileSync(sourcePath, source);
  }
}
