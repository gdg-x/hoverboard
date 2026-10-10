import { title as siteTitle } from '../config/site';
import { type Page, pageText } from '../utils/page-text';

export interface ImageMetadata {
  image?: string;
  imageAlt?: string;
  imageType?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface Metadata extends ImageMetadata {
  title: string;
  description: string;
}

const IMAGE_TYPES: Record<string, string> = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

/** The image's type from its extension, for `og:image:type`. */
export const imageType = (image: string): string | undefined =>
  IMAGE_TYPES[
    /\.(\w+)$/.exec(new URL(image, 'https://site.test').pathname)?.[1]?.toLowerCase() ?? ''
  ];

/** The layout's metadata for a page with a fixed title, as `PageMetadataController` sets it. */
export const pageMetadata = (page: Page): Metadata => {
  const { title, metaDescription } = pageText(page);
  return { title: `${title} | ${siteTitle}`, description: metaDescription };
};

/**
 * The layout's metadata for a speaker, session or post, as `updateImageMetadata()` sets it. The
 * image is a URL, or a share image's tags.
 */
export const itemMetadata = (
  title: string,
  description: string,
  image?: string | ImageMetadata,
): Metadata => ({
  title: `${title} | ${siteTitle}`,
  description,
  ...(typeof image === 'string' ? (image ? { image } : {}) : image),
});
