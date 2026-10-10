import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { GET, getStaticPaths } from '../pages/images/manifest/icon-[size].png';
import { ICON_SIZES } from './icons';

const dir = mkdtempSync(join(tmpdir(), 'hoverboard-icon-'));
const icon = { file: join(dir, 'icon.svg') };
// A wide SVG with a tiny viewBox, the hardest case to keep sharp and square.
writeFileSync(
  icon.file,
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 12"><rect width="24" height="12" fill="red"/></svg>',
);

vi.mock('virtual:hoverboard/icon', () => ({
  get iconFile() {
    return icon.file;
  },
}));

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const render = async (size: number) => {
  const response = await GET({ props: { size } } as never);
  return { response, png: Buffer.from(await response.arrayBuffer()) };
};

describe('icon pages', () => {
  it('builds one icon per size', () => {
    expect(getStaticPaths().map(({ params }) => params.size)).toEqual(ICON_SIZES.map(String));
  });

  it('resizes the icon to a square PNG', async () => {
    const { response, png } = await render(192);

    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(await sharp(png).metadata()).toMatchObject({ format: 'png', width: 192, height: 192 });
  });

  it('centers a wide icon on a transparent square, drawn at full size', async () => {
    const { png } = await render(512);
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const alpha = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];

    expect(alpha(256, 10)).toBe(0);
    expect(alpha(256, 256)).toBe(255);
    expect(alpha(2, 256)).toBe(255);
  });
});
