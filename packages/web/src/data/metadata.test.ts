import { describe, expect, it } from 'vitest';
import { title } from '../config/site';
import { pageText } from '../utils/page-text';
import { itemMetadata, pageMetadata } from './metadata';

describe('pageMetadata', () => {
  it("adds the site title to the page's title and uses its description", () => {
    const { title: pageTitle, metaDescription } = pageText('faq');

    expect(pageMetadata('faq')).toEqual({
      title: `${pageTitle} | ${title}`,
      description: metaDescription,
    });
  });
});

describe('itemMetadata', () => {
  it("adds the site title to the item's title", () => {
    expect(itemMetadata('Ada Lovelace', 'Bio', '/images/ada.jpg')).toEqual({
      title: `Ada Lovelace | ${title}`,
      description: 'Bio',
      image: '/images/ada.jpg',
    });
  });

  it('leaves the image out when the item has none', () => {
    expect(itemMetadata('Keynote', 'Opening')).not.toHaveProperty('image');
  });
});
