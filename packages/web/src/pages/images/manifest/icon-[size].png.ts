import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { iconFile } from 'virtual:hoverboard/icon';
import { ICON_SIZES } from '../../../data/icons';

export const getStaticPaths = (() =>
  ICON_SIZES.map((size) => ({
    params: { size: String(size) },
    props: { size },
  }))) satisfies GetStaticPaths;

// `icon` from site.json at one size, on a transparent square if it isn't square.
export const GET: APIRoute<{ size: number }> = async ({ props: { size } }) => {
  // An SVG renders at 72 DPI, so a small one needs more to stay sharp. A PNG ignores it.
  const { width = size, height = size } = await sharp(iconFile).metadata();
  const density = Math.max(72, Math.ceil((72 * size) / Math.min(width, height)));
  const png = await sharp(iconFile, { density })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
