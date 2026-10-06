import { describe, expect, it } from 'vitest';
import { image, title as siteTitle } from './data';
import { INCLUDE_SITE_TITLE, updateImageMetadata, updateMetadata } from './metadata';

const meta = (attribute: 'name' | 'property', value: string) =>
  document.head.querySelector(`meta[${attribute}="${value}"]`)?.getAttribute('content');

describe('updateImageMetadata', () => {
  it('updates metadata with the given image and appends the site title', () => {
    updateImageMetadata('My Title', 'My description', {
      image: 'https://example.com/image.png',
      imageAlt: 'An image',
    });

    expect(document.title).toBe(`My Title | ${siteTitle}`);
    expect(meta('property', 'og:title')).toBe(`My Title | ${siteTitle}`);
    expect(meta('name', 'description')).toBe('My description');
    expect(meta('property', 'og:description')).toBe('My description');
    expect(meta('property', 'og:image')).toBe('https://example.com/image.png');
    expect(meta('property', 'og:image:alt')).toBe('An image');
    expect(meta('property', 'og:url')).toBe(window.location.href);
  });
});

describe('updateMetadata', () => {
  it('appends the site title by default', () => {
    updateMetadata('My Title', 'My description');

    expect(document.title).toBe(`My Title | ${siteTitle}`);
    expect(meta('property', 'og:image')).toBe(image);
    expect(meta('property', 'og:image:alt')).toBe(siteTitle);
  });

  it('omits the site title when told to', () => {
    updateMetadata('My Title', 'My description', INCLUDE_SITE_TITLE.NO);

    expect(document.title).toBe('My Title');
    expect(meta('property', 'og:title')).toBe('My Title');
  });

  it('reuses existing meta tags instead of adding duplicates', () => {
    updateMetadata('First', 'First description');
    updateMetadata('Second', 'Second description');

    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(meta('name', 'description')).toBe('Second description');
  });
});
