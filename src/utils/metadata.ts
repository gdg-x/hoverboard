import { updateMetadata as pwaUpdateMetadata } from 'pwa-helpers/metadata.js';

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
    title: `${title} | {$ title $}`,
    description,
    image: data.image,
    imageAlt: data.image,
  });
};

export const updateMetadata = (
  title: string,
  description: string,
  includeSiteTitle = INCLUDE_SITE_TITLE.YES
) => {
  const fullTitle = includeSiteTitle === INCLUDE_SITE_TITLE.YES ? `${title} | {$ title $}` : title;
  pwaUpdateMetadata({
    title: fullTitle,
    description,
    image: '{$ image if image.startsWith("http") else (url + image) $}',
    imageAlt: '{$ title $}',
  });
};
