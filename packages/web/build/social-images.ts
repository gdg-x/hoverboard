import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { BUILT_IN_FONTS, type BuiltInFontName, type FontRole } from '../src/themes/fonts';
import type { ColorSet } from '../src/themes/tokens';
import type { SiteFonts } from './fonts';
import type { ResolvedTheme } from './theme';

export type SocialFontRole = Extract<FontRole, 'display' | 'body'>;

export interface SocialFont {
  role: SocialFontRole;
  /** One per subset: Satori keeps one font per family and weight, and falls back between families. */
  name: string;
  /** Absolute. */
  path: string;
  weight: number;
}

/** What `virtual:hoverboard/social-images` exports. */
export interface SocialImageDesign {
  fonts: SocialFont[];
  colors: ColorSet;
  avatarRadius: string;
  /** The logo's SVG markup. */
  logo: string | undefined;
  /** Where photos with a path instead of a URL are. Absolute. */
  publicDir: string;
  /** Changes when anything above changes, so image file names change with the design. */
  designKey: string;
}

const require = createRequire(import.meta.url);

// The weights the images use.
const WEIGHTS: Record<SocialFontRole, number[]> = { display: [700], body: [400, 600] };
// Satori reads no WOFF2.
const FORMATS = ['.ttf', '.otf', '.woff'];

/** The static `@fontsource` files of a built-in font, every subset, since Satori has no variable fonts. */
const builtInFonts = (name: BuiltInFontName, role: SocialFontRole): SocialFont[] => {
  const id = BUILT_IN_FONTS[name].package.split('/')[1] ?? '';
  const dir = join(dirname(require.resolve(`@fontsource/${id}/package.json`)), 'files');
  const files = fs.readdirSync(dir);
  // Latin first, so it is the first family to try.
  const order = (subset: string) => (subset.startsWith('latin') ? `0${subset}` : subset);
  return WEIGHTS[role].flatMap((weight) => {
    const suffix = `-${weight}-normal.woff`;
    return files
      .filter((file) => file.endsWith(suffix))
      .map((file) => file.slice(id.length + 1, -suffix.length))
      .sort((a, b) => order(a).localeCompare(order(b)))
      .map((subset) => ({
        role,
        name: `${role}-${subset}`,
        weight,
        path: join(dir, `${id}-${subset}${suffix}`),
      }));
  });
};

/**
 * The fonts for the share images: the site's own files in a format Satori reads, or else the
 * theme's built-in font, with a warning when the site has a font the images can't use.
 */
export const socialImageFonts = (
  themeFonts: Readonly<Record<FontRole, BuiltInFontName>>,
  siteFonts: SiteFonts | undefined,
  siteDir: string,
): { fonts: SocialFont[]; warnings: string[] } => {
  const warnings: string[] = [];
  const fonts = (['display', 'body'] as const).flatMap((role) => {
    const font = siteFonts?.[role];
    if (!font) return builtInFonts(themeFonts[role], role);
    const usable = (font.files ?? []).filter(
      ({ src, style = 'normal', weight }) =>
        FORMATS.includes(extname(src).toLowerCase()) &&
        style === 'normal' &&
        /^[1-9]00$/.test(String(weight)),
    );
    if (usable.length) {
      // Files with the same weight cover different characters, so each gets a family.
      return usable.map(({ src, weight }, index) => ({
        role,
        name: `${role}-${usable.slice(0, index).filter((file) => Number(file.weight) === Number(weight)).length}`,
        weight: Number(weight),
        path: resolve(siteDir, src),
      }));
    }
    warnings.push(
      `site.json/theme/fonts/${role}: share images need a TTF, OTF or WOFF file with a weight such as 400, so they use ${BUILT_IN_FONTS[themeFonts[role]].family} instead of "${font.family}".`,
    );
    return builtInFonts(themeFonts[role], role);
  });
  return { fonts, warnings };
};

/** The images use the light colors and logo, unless the site only has the dark scheme. */
export const socialImageDesign = (
  theme: ResolvedTheme,
  siteFonts: SiteFonts | undefined,
  { siteDir, publicDir }: { siteDir: string; publicDir: string },
): { design: SocialImageDesign; warnings: string[] } => {
  const dark = theme.colorScheme === 'dark';
  const { fonts, warnings } = socialImageFonts(theme.fonts, siteFonts, siteDir);
  const logoFile = [...(dark ? ['images/logo-dark.svg'] : []), 'images/logo.svg']
    .map((file) => join(publicDir, file))
    .find((file) => fs.existsSync(file));
  const logo = logoFile ? fs.readFileSync(logoFile, 'utf8') : undefined;
  const colors = dark ? theme.dark : theme.light;
  const avatarRadius = theme.style.radiusAvatar;
  // File names, not paths, so the key is the same on every machine.
  const fontNames = fonts.map(({ name, weight, path }) => [name, weight, basename(path)]);
  const designKey = createHash('sha256')
    .update(JSON.stringify([colors, avatarRadius, fontNames, logo]))
    .digest('hex')
    .slice(0, 8);
  return {
    design: { fonts, colors, avatarRadius, logo, publicDir: resolve(publicDir), designKey },
    warnings,
  };
};
