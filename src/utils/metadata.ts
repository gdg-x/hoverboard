import { updateMetadata as pwaUpdateMetadata } from 'pwa-helpers/metadata.js';
import { image, title as siteTitle } from './data';

export enum INCLUDE_SITE_TITLE {
  YES,
  NO,
}

interface Image {
  image: string;
  imageAlt: string;
}

export const updateImageMetadata = (title: string, description: string, data: Image) => {
  pwaUpdateMetadata({
    title: `${title} | ${siteTitle}`,
    description,
    image: data.image,
    imageAlt: data.imageAlt,
  });
};

export const updateMetadata = (
  title: string,
  description: string,
  includeSiteTitle = INCLUDE_SITE_TITLE.YES
) => {
  const fullTitle = includeSiteTitle === INCLUDE_SITE_TITLE.YES ? `${title} | ${siteTitle}` : title;
  pwaUpdateMetadata({
    title: fullTitle,
    description,
    image,
    imageAlt: siteTitle,
  });
};
