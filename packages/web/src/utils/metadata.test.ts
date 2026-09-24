import { updateMetadata as pwaUpdateMetadata } from 'pwa-helpers/metadata.js';
import { describe, expect, it, vi } from 'vitest';
import { image, title as siteTitle } from './data';
import { INCLUDE_SITE_TITLE, updateImageMetadata, updateMetadata } from './metadata';

vi.mock('pwa-helpers/metadata.js');

describe('updateImageMetadata', () => {
  it('updates metadata with the given image and appends the site title', () => {
    updateImageMetadata('My Title', 'My description', {
      image: 'https://example.com/image.png',
      imageAlt: 'An image',
    });

    expect(pwaUpdateMetadata).toHaveBeenCalledWith({
      title: `My Title | ${siteTitle}`,
      description: 'My description',
      image: 'https://example.com/image.png',
      imageAlt: 'An image',
    });
  });
});

describe('updateMetadata', () => {
  it('appends the site title by default', () => {
    updateMetadata('My Title', 'My description');

    expect(pwaUpdateMetadata).toHaveBeenCalledWith({
      title: `My Title | ${siteTitle}`,
      description: 'My description',
      image,
      imageAlt: siteTitle,
    });
  });

  it('omits the site title when told to', () => {
    updateMetadata('My Title', 'My description', INCLUDE_SITE_TITLE.NO);

    expect(pwaUpdateMetadata).toHaveBeenCalledWith({
      title: 'My Title',
      description: 'My description',
      image,
      imageAlt: siteTitle,
    });
  });
});
