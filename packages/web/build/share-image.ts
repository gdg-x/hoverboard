import fs from 'node:fs';
import { extname, join } from 'node:path';

export interface ImageDimensions {
  width: number;
  height: number;
  type: string;
}

const MIN_DIMENSION = 200;
const RECOMMENDED_WIDTH = 1200;
const RECOMMENDED_HEIGHT = 627;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const isUrl = (value: string) => /^https?:\/\//.test(value);

/**
 * Reads dimensions and MIME type of PNG, JPEG, WebP or GIF from buffer headers without external dependencies.
 */
export const rasterImageSize = (buffer: Buffer): ImageDimensions | undefined => {
  if (buffer.length < 16) return undefined;

  // PNG
  if (buffer.toString('latin1', 1, 4) === 'PNG' && buffer.length >= 24) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), type: 'image/png' };
  }

  // GIF
  if (buffer.toString('latin1', 0, 6).startsWith('GIF') && buffer.length >= 10) {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8), type: 'image/gif' };
  }

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // Standalone markers without length: RST0-RST7, SOI, EOI, TEM
      if (
        marker === 0xd8 ||
        marker === 0xd9 ||
        (marker !== undefined && marker >= 0xd0 && marker <= 0xd7) ||
        marker === 0x01
      ) {
        offset += 2;
        continue;
      }
      const length = buffer.readUInt16BE(offset + 2);
      // SOF0 - SOF15 (except DHT 0xc4, JPG 0xc8, DAC 0xcc)
      const isSof =
        (marker !== undefined && marker >= 0xc0 && marker <= 0xc3) ||
        (marker !== undefined && marker >= 0xc5 && marker <= 0xc7) ||
        (marker !== undefined && marker >= 0xc9 && marker <= 0xcb) ||
        (marker !== undefined && marker >= 0xcd && marker <= 0xcf);
      if (isSof && offset + 8 < buffer.length) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
          type: 'image/jpeg',
        };
      }
      offset += 2 + length;
    }
  }

  // WebP
  if (buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') {
    const chunkHeader = buffer.toString('latin1', 12, 16);
    if (chunkHeader === 'VP8 ' && buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
        type: 'image/webp',
      };
    }
    if (chunkHeader === 'VP8L' && buffer.length >= 25) {
      const b1 = buffer[21] ?? 0;
      const b2 = buffer[22] ?? 0;
      const b3 = buffer[23] ?? 0;
      const b4 = buffer[24] ?? 0;
      return {
        width: 1 + (((b2 & 0x3f) << 8) | b1),
        height: 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6)),
        type: 'image/webp',
      };
    }
    if (chunkHeader === 'VP8X' && buffer.length >= 30) {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
        type: 'image/webp',
      };
    }
  }

  return undefined;
};

/**
 * Validates the site share image and extracts its dimensions if it's a local file.
 */
export const shareImageProblems = (
  image: string | undefined,
  publicDirs: string[],
): { errors: string[]; warnings: string[]; dimensions?: ImageDimensions } => {
  if (!image) return { errors: [], warnings: [] };

  if (extname(new URL(image, 'https://site.test').pathname).toLowerCase() === '.svg') {
    return {
      errors: [
        `site.json/image: "${image}" is an SVG, which social networks do not support. Use a PNG or JPEG.`,
      ],
      warnings: [],
    };
  }

  if (isUrl(image)) {
    return { errors: [], warnings: [] };
  }

  const file = publicDirs.map((dir) => join(dir, image)).find((path) => fs.existsSync(path));
  if (!file) {
    return { errors: [], warnings: [] };
  }

  const stat = fs.statSync(file);
  if (stat.size > MAX_BYTES) {
    const mb = (stat.size / (1024 * 1024)).toFixed(1);
    return {
      errors: [
        `site.json/image: "${image}" is ${mb} MB, and must be under 5 MB for social link previews`,
      ],
      warnings: [],
    };
  }

  const buffer = fs.readFileSync(file);
  const size = rasterImageSize(buffer);
  if (!size) {
    return {
      errors: [`site.json/image: "${image}" is not a recognized raster image (PNG, JPEG, WebP)`],
      warnings: [],
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  if (size.width < MIN_DIMENSION || size.height < MIN_DIMENSION) {
    errors.push(
      `site.json/image: "${image}" is ${size.width}×${size.height} pixels, and needs to be at least ${MIN_DIMENSION}×${MIN_DIMENSION} pixels for social link previews`,
    );
  } else if (size.width < RECOMMENDED_WIDTH || size.height < RECOMMENDED_HEIGHT) {
    warnings.push(
      `site.json/image: "${image}" is ${size.width}×${size.height} pixels. A landscape image of at least 1200×630 pixels is recommended for large link preview cards on LinkedIn and Facebook.`,
    );
  }

  return { errors, warnings, dimensions: size };
};
