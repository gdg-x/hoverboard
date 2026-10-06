import { image, title as siteTitle } from './data';

export enum INCLUDE_SITE_TITLE {
  YES,
  NO,
}

interface Image {
  image: string;
  imageAlt: string;
}

interface Metadata {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

const setMetaTag = (attribute: 'name' | 'property', value: string, content: string) => {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const applyMetadata = (metadata: Metadata) => {
  if (metadata.title) {
    document.title = metadata.title;
    setMetaTag('property', 'og:title', metadata.title);
  }
  if (metadata.description) {
    setMetaTag('name', 'description', metadata.description);
    setMetaTag('property', 'og:description', metadata.description);
  }
  if (metadata.image) {
    setMetaTag('property', 'og:image', metadata.image);
  }
  if (metadata.imageAlt) {
    setMetaTag('property', 'og:image:alt', metadata.imageAlt);
  }
  setMetaTag('property', 'og:url', window.location.href);
};

export const updateImageMetadata = (title: string, description: string, data: Image) => {
  applyMetadata({
    title: `${title} | ${siteTitle}`,
    description,
    image: data.image,
    imageAlt: data.imageAlt,
  });
};

export const updateMetadata = (
  title: string,
  description: string,
  includeSiteTitle = INCLUDE_SITE_TITLE.YES,
) => {
  const fullTitle = includeSiteTitle === INCLUDE_SITE_TITLE.YES ? `${title} | ${siteTitle}` : title;
  applyMetadata({
    title: fullTitle,
    description,
    image,
    imageAlt: siteTitle,
  });
};
