// Builds the UI locales the site lists in `locales` in site.json into src/generated/locales/.
// Fails when one of them has no XLIFF in packages/translations.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const translationsRoot = resolve(webRoot, '../translations');
export const cli = join(webRoot, 'node_modules/@lit/localize-tools/bin/lit-localize.js');
export const config = JSON.parse(readFileSync(join(webRoot, 'lit-localize.json'), 'utf8'));

export const xliffPath = (locale) => join(translationsRoot, 'xliff', `${locale}.xlf`);

/** Resolves a path or glob from lit-localize.json, which is relative to `packages/web`. */
export const absolute = (pattern) => {
  const negated = pattern.startsWith('!');
  const path = resolve(webRoot, negated ? pattern.slice(1) : pattern)
    .split(sep)
    .join('/');
  return negated ? `!${path}` : path;
};

const readLocales = (path) => JSON.parse(readFileSync(path, 'utf8')).locales ?? {};

/**
 * Every locale in `locales.source` and `locales.targets` except the source locale in code. The
 * site's `locales` merges over the defaults, as in resolve-config.ts.
 */
export const siteTargetLocales = (siteDir = resolve(webRoot, '../config')) => {
  const { source, targets = [] } = {
    ...readLocales(join(webRoot, 'defaults/site.json')),
    ...readLocales(join(siteDir, 'site.json')),
  };
  return [...new Set([source, ...targets])].filter(
    (locale) => locale && locale !== config.sourceLocale,
  );
};

// Matches `$defs/locale` in site.schema.json. Checked here too, because locale codes become file
// paths and this runs before the build validates site.json.
const LOCALE = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-([A-Z]{2}|\d{3}))?$/;
export const isLocale = (locale) => LOCALE.test(locale);

export const missingXliffErrors = (locales) =>
  locales.flatMap((locale) => {
    if (!isLocale(locale)) return [`site.json/locales: "${locale}" is not a locale code.`];
    if (existsSync(xliffPath(locale))) return [];
    return [
      `${locale}: site.json lists it in locales, but packages/translations/xliff/${locale}.xlf does not exist.`,
    ];
  });

/** Runs `lit-localize build` for `locales`, after removing the modules of an earlier build. */
export const buildLocales = (locales) => {
  const dir = mkdtempSync(join(tmpdir(), 'hoverboard-localize-'));
  try {
    const configPath = join(dir, 'lit-localize.json');
    const outputDir = absolute(config.output.outputDir);
    writeFileSync(
      configPath,
      JSON.stringify({
        ...config,
        targetLocales: locales,
        inputFiles: config.inputFiles.map(absolute),
        output: {
          ...config.output,
          outputDir,
          localeCodesModule: absolute(config.output.localeCodesModule),
        },
        interchange: { ...config.interchange, xliffDir: absolute(config.interchange.xliffDir) },
      }),
    );
    rmSync(outputDir, { recursive: true, force: true });
    execFileSync(process.execPath, [cli, 'build', `--config=${configPath}`], { stdio: 'inherit' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const locales = siteTargetLocales();
  const errors = missingXliffErrors(locales);
  for (const error of errors) console.error(error);
  if (errors.length) process.exitCode = 1;
  else buildLocales(locales);
}
