import { describe, expect, it } from 'vitest';
import { rasterImageSize, shareImageProblems } from './share-image';

describe('rasterImageSize', () => {
  it('parses a PNG buffer size', () => {
    // 588 x 553 PNG
    const buffer = Buffer.alloc(24);
    buffer.write('\x89PNG\r\n\x1a\n', 0, 'latin1');
    buffer.writeUInt32BE(588, 16);
    buffer.writeUInt32BE(553, 20);

    expect(rasterImageSize(buffer)).toEqual({
      width: 588,
      height: 553,
      type: 'image/png',
    });
  });

  it('parses a JPEG buffer size from SOF0', () => {
    // SOI, SOF0, 1600x900
    const buffer = Buffer.alloc(30);
    buffer[0] = 0xff;
    buffer[1] = 0xd8; // SOI
    buffer[2] = 0xff;
    buffer[3] = 0xc0; // SOF0
    buffer.writeUInt16BE(17, 4); // segment length
    buffer[6] = 8; // precision
    buffer.writeUInt16BE(900, 7); // height
    buffer.writeUInt16BE(1600, 9); // width

    expect(rasterImageSize(buffer)).toEqual({
      width: 1600,
      height: 900,
      type: 'image/jpeg',
    });
  });

  it('returns undefined for invalid or too short buffers', () => {
    expect(rasterImageSize(Buffer.from('not an image'))).toBeUndefined();
    expect(rasterImageSize(Buffer.alloc(4))).toBeUndefined();
  });
});

describe('shareImageProblems', () => {
  it('rejects an SVG image', () => {
    const { errors } = shareImageProblems('images/logo.svg', []);

    expect(errors).toEqual([
      'site.json/image: "images/logo.svg" is an SVG, which social networks do not support. Use a PNG or JPEG.',
    ]);
  });

  it('ignores external URLs without error', () => {
    const { errors, warnings } = shareImageProblems('https://example.com/share.png', []);

    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });
});
