import { describe, expect, it } from 'vitest';
import type { SiteConfig } from './resolve-config';
import { attendingPrecache } from './service-worker';

const config = ({
  attending = true,
  attendance = 'inPerson',
  attendingPage,
}: {
  attending?: boolean;
  attendance?: string;
  attendingPage?: object;
}) =>
  ({
    site: { features: { attending }, event: { attendance } },
    resources: { attendingPage },
  }) as unknown as Pick<SiteConfig, 'site' | 'resources'>;

const attendingPage = {
  photo: { image: '/images/venue.jpg', alt: 'The venue' },
  floorPlan: { image: 'images/floor-plan.png', alt: 'The plan' },
};

describe('attendingPrecache', () => {
  it('precaches the attending page and its images on the site', () => {
    expect(attendingPrecache(config({ attendingPage }))).toEqual([
      'attending.html',
      'images/venue.jpg',
      'images/floor-plan.png',
    ]);
  });

  it('leaves out images on other sites, and a page without images', () => {
    expect(
      attendingPrecache(
        config({
          attendingPage: { photo: { image: 'https://cdn.example/venue.jpg', alt: 'The venue' } },
        }),
      ),
    ).toEqual(['attending.html']);
    expect(attendingPrecache(config({}))).toEqual(['attending.html']);
  });

  it('leaves out the images of an online event, which the page does not show', () => {
    expect(attendingPrecache(config({ attendance: 'online', attendingPage }))).toEqual([
      'attending.html',
    ]);
  });

  it('precaches nothing with the attending feature off', () => {
    expect(attendingPrecache(config({ attending: false, attendingPage }))).toEqual([]);
  });
});
