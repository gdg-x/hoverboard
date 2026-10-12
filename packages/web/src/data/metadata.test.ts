import { describe, expect, it } from 'vitest';
import { attendingPage, title } from '../config/site';
import { pageText, scheduleDetail } from '../utils/page-text';
import { imageType, itemMetadata, pageMetadata } from './metadata';

describe('pageMetadata', () => {
  it("adds the site title to the page's title and uses its description", () => {
    const { title: pageTitle, metaDescription } = pageText('faq');

    expect(pageMetadata('faq')).toEqual({
      title: `${pageTitle} | ${title}`,
      description: metaDescription,
    });
  });

  it("uses the organizers' description for the attending page", () => {
    expect(attendingPage?.description).toBeTruthy();
    expect(pageMetadata('attending').description).toBe(attendingPage?.description);
  });

  it('puts what the page shows before its title, so pages of one kind differ', () => {
    expect(pageMetadata('schedule', 'October 8').title).toBe(`October 8 | Schedule | ${title}`);
  });
});

describe('scheduleDetail', () => {
  it.each([
    ['/schedule', {}, undefined],
    ['/schedule/2026-10-08', { id: '2026-10-08' }, 'October 8'],
    ['/schedule/my-schedule', {}, 'My Schedule'],
  ])('names what %s shows', (pathname, params, detail) => {
    expect(scheduleDetail({ pathname, search: '', params })).toBe(detail);
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
    expect(itemMetadata('Keynote', 'Opening', '')).not.toHaveProperty('image');
  });

  it("takes a share image's tags", () => {
    const image = {
      image: 'https://site.test/social/sessions/keynote-1234abcd.png',
      imageAlt: 'Keynote',
      imageType: 'image/png',
      imageWidth: 1200,
      imageHeight: 630,
    };

    expect(itemMetadata('Keynote', 'Opening', image)).toEqual({
      title: `Keynote | ${title}`,
      description: 'Opening',
      ...image,
    });
  });
});

describe('imageType', () => {
  it("is the type of the image's extension", () => {
    expect(imageType('https://site.test/images/social-share.jpg')).toBe('image/jpeg');
    expect(imageType('/images/logo.SVG')).toBe('image/svg+xml');
    expect(imageType('https://site.test/a.png?v=2#top')).toBe('image/png');
  });

  it('is undefined for an unknown or missing extension', () => {
    expect(imageType('https://photos.test/ada')).toBeUndefined();
    expect(imageType('/images/a.heic')).toBeUndefined();
  });
});
