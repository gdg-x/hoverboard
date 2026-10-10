import fs from 'node:fs';
import { extname, join } from 'node:path';
import { ICON_SIZES } from '../src/data/icons';

const MIN_SIZE = Math.max(...ICON_SIZES);

/** A PNG's size, from its header. */
export const pngSize = (data: Buffer): { width: number; height: number } | undefined =>
  data.toString('latin1', 1, 4) === 'PNG' && data.length >= 24
    ? { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }
    : undefined;

/** The site icon must be in packages/web/public, and a PNG big enough for the largest icon. */
export const iconErrors = (icon: string, publicDir: string): string[] => {
  const file = join(publicDir, icon);
  if (!fs.existsSync(file)) return [`site.json/icon: "${icon}" is not in packages/web/public`];
  if (extname(icon).toLowerCase() !== '.png') return [];
  const size = pngSize(fs.readFileSync(file));
  if (!size) return [`site.json/icon: "${icon}" is not a PNG file`];
  return size.width < MIN_SIZE || size.height < MIN_SIZE
    ? [
        `site.json/icon: "${icon}" is ${size.width}×${size.height} pixels, and needs to be at least ${MIN_SIZE}×${MIN_SIZE}`,
      ]
    : [];
};
