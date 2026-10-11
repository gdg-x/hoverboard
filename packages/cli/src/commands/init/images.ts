import { copyFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { extname, join } from 'path';
import { UsageError } from '../../lib/command.js';
import { CONFIG_DIR } from '../../utils/firebase-project.js';

type Json = Record<string, unknown>;

/** Image files to copy into the site's public folder. */
export interface SiteImages {
  /** The header logo, an SVG. */
  logo?: string;
  /** The home screen and browser tab icon, a PNG of at least 512×512 pixels, or an SVG. */
  icon?: string;
  /** The image link previews show, a JPEG or PNG. */
  shareImage?: string;
}

export const IMAGES_DIR = `${CONFIG_DIR}/public/images`;

const copy = (source: string, extensions: string[], option: string, dir: string, name: string) => {
  const extension = extname(source).toLowerCase();
  if (!extensions.includes(extension)) {
    throw new UsageError(`${option} needs a ${extensions.join(' or ')} file: ${source}`);
  }
  if (!existsSync(source)) throw new UsageError(`${option}: ${source} does not exist.`);
  const file = `${name}${extension === '.jpeg' ? '.jpg' : extension}`;
  copyFileSync(source, join(dir, file));
  return `images/${file}`;
};

/**
 * Copies the organizer's images into packages/config/public/images, and returns site.json pointing
 * at them. The site config check then checks them as the build does, such as the icon's size.
 */
export const copySiteImages = (repoRoot: string, site: Json, images: SiteImages): Json => {
  const { logo, icon, shareImage } = images;
  if (!logo && !icon && !shareImage) return site;
  const dir = join(repoRoot, IMAGES_DIR);
  mkdirSync(dir, { recursive: true });
  const next = { ...site };
  if (logo) {
    copy(logo, ['.svg'], '--logo', dir, 'logo');
    // The demo's dark scheme logo. Without one, the header shows the short name in the dark scheme.
    rmSync(join(dir, 'logo-dark.svg'), { force: true });
  }
  if (icon) next['icon'] = copy(icon, ['.png', '.svg'], '--icon', dir, 'icon');
  if (shareImage) {
    next['image'] = copy(
      shareImage,
      ['.jpg', '.jpeg', '.png'],
      '--share-image',
      dir,
      'social-share',
    );
  }
  return next;
};
