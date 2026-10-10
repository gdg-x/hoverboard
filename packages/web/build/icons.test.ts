import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { iconErrors, pngSize } from './icons';

const png = (width: number, height = width) =>
  sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .png()
    .toBuffer();

describe('pngSize', () => {
  it("reads a PNG's width and height", async () => {
    expect(pngSize(await png(640, 480))).toEqual({ width: 640, height: 480 });
  });

  it('is undefined for other files', () => {
    expect(pngSize(Buffer.from('<svg></svg>'))).toBeUndefined();
    expect(pngSize(Buffer.from('\u0089PNG'))).toBeUndefined();
  });
});

describe('iconErrors', () => {
  let publicDir: string;

  beforeEach(() => {
    publicDir = mkdtempSync(join(tmpdir(), 'hoverboard-icon-'));
  });

  afterEach(() => rmSync(publicDir, { recursive: true, force: true }));

  it('accepts a PNG of at least 512×512 pixels, and any SVG', async () => {
    writeFileSync(join(publicDir, 'icon.png'), await png(1024));
    writeFileSync(join(publicDir, 'icon.svg'), '<svg viewBox="0 0 24 24"></svg>');

    expect(iconErrors('icon.png', publicDir)).toEqual([]);
    expect(iconErrors('icon.svg', publicDir)).toEqual([]);
  });

  it('rejects an icon that is not in packages/web/public', () => {
    expect(iconErrors('images/missing.png', publicDir)).toEqual([
      'site.json/icon: "images/missing.png" is not in packages/web/public',
    ]);
  });

  it('rejects a PNG that is too small for the largest icon', async () => {
    writeFileSync(join(publicDir, 'icon.png'), await png(512, 256));

    expect(iconErrors('icon.png', publicDir)).toEqual([
      'site.json/icon: "icon.png" is 512×256 pixels, and needs to be at least 512×512',
    ]);
  });

  it('rejects a .png file that is not a PNG', () => {
    writeFileSync(join(publicDir, 'icon.png'), 'not a png');

    expect(iconErrors('icon.png', publicDir)).toEqual([
      'site.json/icon: "icon.png" is not a PNG file',
    ]);
  });

  it("accepts the repository's icon", () => {
    expect(iconErrors('images/icon.png', join(import.meta.dirname, '../public'))).toEqual([]);
  });
});
