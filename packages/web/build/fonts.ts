import { createFontStack } from '@capsizecss/core';
import { fromFile } from '@capsizecss/unpack/fs';
import { create } from 'fontkitten';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import {
  BUILT_IN_FONTS,
  type BuiltInFontName,
  FONT_ROLES,
  type FontRole,
} from '../src/themes/fonts';

export interface FontFile {
  /** A path in packages/config. */
  src: string;
  weight: number | string;
  style?: 'normal' | 'italic';
  unicodeRange?: string;
}

/** `theme.fonts.<role>` in site.json: local files, a font service's stylesheet, or installed fonts. */
export interface SiteFont {
  family: string;
  files?: FontFile[];
  stylesheet?: string;
  /** Display only: multiplies the display type sizes. */
  scale?: number;
}

export type SiteFonts = Partial<Record<FontRole, SiteFont>>;

const MAX_ROLE_BYTES = 150 * 1024;

type MetricsModule = Parameters<typeof createFontStack>[0][number];

const require = createRequire(import.meta.url);

const genericFor = (role: FontRole) => (role === 'mono' ? 'monospace' : 'sans-serif');

/** Problems with local font files. Missing files are errors; uncovered characters and size, warnings. */
export const fontProblems = (
  fonts: SiteFonts | undefined,
  siteDir: string,
  texts: string[],
): { errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const characters = [...new Set(texts.join('').replace(/\s/g, ''))];
  for (const role of FONT_ROLES) {
    const font = fonts?.[role];
    if (!font?.files) continue;
    const path = `site.json/theme/fonts/${role}`;
    const existing = font.files.flatMap((file, index) => {
      const filePath = join(siteDir, file.src);
      if (fs.existsSync(filePath)) return [filePath];
      errors.push(`${path}/files/${index}/src: "${file.src}" is not in packages/config`);
      return [];
    });
    if (!existing.length) continue;

    const bytes = existing.reduce((sum, file) => sum + fs.statSync(file).size, 0);
    if (bytes > MAX_ROLE_BYTES) {
      warnings.push(
        `${path}: the files are ${Math.round(bytes / 1024)}KB, more than ${MAX_ROLE_BYTES / 1024}KB. Visitors download them on their first visit.`,
      );
    }

    const faces = existing.flatMap((file) => {
      const font = create(fs.readFileSync(file));
      return font.isCollection ? font.fonts : [font];
    });
    const missing = characters.filter(
      (character) =>
        !faces.some((face) => face.hasGlyphForCodePoint(character.codePointAt(0) ?? 0)),
    );
    if (missing.length) {
      warnings.push(
        `${path}: "${font.family}" has no glyphs for ${missing.join(' ')}. Browsers show them in another font.`,
      );
    }
  }
  return { errors, warnings };
};

interface FontModuleParts {
  /** CSS, with `{ url }` where an imported file's URL goes. */
  css: (string | { url: string })[];
  stylesheets: string[];
  preload?: string | undefined;
}

const fontFace = (family: string, url: string, weight: string, rest: string) => [
  `@font-face{font-family:${JSON.stringify(family)};font-display:swap;font-weight:${weight};${rest}src:url(`,
  { url },
  `)}`,
];

// `require`, not `import()`: Astro loads this file with a Vite module runner that is closed by the
// time the plugin loads the fonts module.
const metricsFor = (name: string) => require(`@capsizecss/metrics/${name}`) as MetricsModule;

const fallback = (metrics: MetricsModule, role: FontRole) =>
  createFontStack([metrics, metricsFor(role === 'mono' ? 'courierNew' : 'arial')]);

const builtInParts = (name: BuiltInFontName, role: FontRole) => {
  const font = BUILT_IN_FONTS[name];
  const packageDir = dirname(require.resolve(`${font.package}/package.json`));
  const unicode = JSON.parse(fs.readFileSync(join(packageDir, 'unicode.json'), 'utf8')) as Record<
    string,
    string
  >;
  const { variable } = JSON.parse(fs.readFileSync(join(packageDir, 'metadata.json'), 'utf8')) as {
    variable: { wght: { min: string; max: string } };
  };
  const id = font.package.split('/')[1];
  const css = Object.entries(unicode).flatMap(([subset, range]) =>
    fontFace(
      font.family,
      `${font.package}/files/${id}-${subset}-wght-normal.woff2`,
      `${variable.wght.min} ${variable.wght.max}`,
      `font-style:normal;unicode-range:${range};`,
    ),
  );
  const stack = fallback({ ...metricsFor(font.metrics), familyName: font.family }, role);
  return {
    css: [...css, stack.fontFaces],
    stack: `${stack.fontFamily}, ${font.generic}`,
    preload: `${font.package}/files/${id}-latin-wght-normal.woff2`,
  };
};

const localParts = async (
  font: SiteFont & { files: FontFile[] },
  role: FontRole,
  siteDir: string,
) => {
  // Absolute, because the virtual module that imports them has no directory.
  const paths = font.files.map((file) => resolve(siteDir, file.src));
  const css = font.files.flatMap((file, index) =>
    fontFace(
      font.family,
      paths[index] ?? '',
      String(file.weight),
      `font-style:${file.style ?? 'normal'};${file.unicodeRange ? `unicode-range:${file.unicodeRange};` : ''}`,
    ),
  );
  const metrics = await fromFile(paths[0] ?? '');
  const stack = fallback({ ...metrics, familyName: font.family }, role);
  return {
    css: [...css, stack.fontFaces],
    stack: `${stack.fontFamily}, ${genericFor(role)}`,
    preload: paths[0],
  };
};

/**
 * The `@font-face` rules and `--hb-font-*` variables for the theme's fonts, with the site's
 * `theme.fonts` over them. Built-in fonts of roles the site overrides are left out.
 */
export const fontModuleParts = async (
  themeFonts: Record<FontRole, BuiltInFontName>,
  siteFonts: SiteFonts | undefined,
  siteDir: string,
): Promise<FontModuleParts> => {
  const css: FontModuleParts['css'] = [];
  const stylesheets: string[] = [];
  const stacks: Partial<Record<FontRole, string>> = {};
  let preload: string | undefined;
  for (const role of FONT_ROLES) {
    const font = siteFonts?.[role];
    let stack: string;
    if (font?.files?.length) {
      const parts = await localParts({ ...font, files: font.files }, role, siteDir);
      css.push(...parts.css);
      stack = parts.stack;
      if (role === 'display') preload = parts.preload;
    } else if (font?.stylesheet) {
      stylesheets.push(font.stylesheet);
      stack = `${JSON.stringify(font.family)}, ${genericFor(role)}`;
    } else if (font) {
      stack = font.family;
    } else {
      const parts = builtInParts(themeFonts[role], role);
      css.push(...parts.css);
      stack = parts.stack;
      if (role === 'display') preload = parts.preload;
    }
    stacks[role] = stack;
  }
  const variables = FONT_ROLES.map((role) => `--hb-font-${role}:${stacks[role]};`).join('');
  css.push(`:root{${variables}--hb-display-scale:${siteFonts?.display?.scale ?? 1};}`);
  return { css, stylesheets, preload };
};

/**
 * `virtual:hoverboard/fonts`: the font CSS, with each file imported with `?url` so Vite serves it
 * in development and emits it with a hashed name in the build. `no-inline` keeps small files out of
 * the HTML of every page; browsers download only the subsets a page uses.
 */
export const fontModuleCode = ({ css, stylesheets, preload }: FontModuleParts): string => {
  const urls = new Map<string, string>();
  const variable = (url: string) => {
    if (!urls.has(url)) urls.set(url, `font${urls.size}`);
    return urls.get(url) ?? '';
  };
  const cssCode = css
    .map((part) => (typeof part === 'string' ? JSON.stringify(part) : variable(part.url)))
    .join(' + ');
  const preloadCode = preload ? variable(preload) : 'undefined';
  const imports = [...urls].map(
    ([url, name]) => `import ${name} from ${JSON.stringify(`${url}?url&no-inline`)};`,
  );
  return [
    ...imports,
    `export const fontCss = ${cssCode || '""'};`,
    `export const fontStylesheets = ${JSON.stringify(stylesheets)};`,
    `export const preloadFont = ${preloadCode};`,
    '',
  ].join('\n');
};
