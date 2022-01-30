import { updateMetadata as pwaUpdateMetadata } from 'pwa-helpers/metadata.js';

interface Image {
  image?: string;
  imageAlt?: string;
}

export const updateMetadata = (title: string, description: string, data: Image = {}) => {
  pwaUpdateMetadata({
    title,
    description,
    image: data.image || '{$ image if image.startsWith("http") else (url + image) $}',
    imageAlt: data.image || '{$ title $}',
  });
};
