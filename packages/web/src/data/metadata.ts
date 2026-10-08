import { title as siteTitle } from '../config/site';
import { type Page, pageText } from '../utils/page-text';

export interface Metadata {
  title: string;
  description: string;
  image?: string;
}

/** The layout's metadata for a page with a fixed title, as `PageMetadataController` sets it. */
export const pageMetadata = (page: Page): Metadata => {
  const { title, metaDescription } = pageText(page);
  return { title: `${title} | ${siteTitle}`, description: metaDescription };
};

/** The layout's metadata for a speaker, session or post, as `updateImageMetadata()` sets it. */
export const itemMetadata = (title: string, description: string, image?: string): Metadata => ({
  title: `${title} | ${siteTitle}`,
  description,
  ...(image ? { image } : {}),
});
