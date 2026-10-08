import { describe, expect, it } from 'vitest';
import { eventStructuredData, openGraphLocale, serializeJsonLd } from './structured-data';

const site = {
  url: 'https://fest.example/',
  image: 'https://fest.example/images/social-share.jpg',
  organizer: { name: 'GDG Example', url: 'https://gdg.example/' },
  event: {
    startDate: '2027-10-15',
    endDate: '2027-10-16',
    location: { name: 'Hall', address: '1 Main Street, City', city: 'City' },
  },
};
const resources = { title: 'Example Fest', description: 'A conference' };

describe('eventStructuredData', () => {
  it('describes the event from the site config', () => {
    expect(eventStructuredData(site, resources)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: 'Example Fest',
      description: 'A conference',
      startDate: '2027-10-15',
      endDate: '2027-10-16',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: 'Hall',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '1 Main Street, City',
          addressLocality: 'City',
        },
      },
      image: ['https://fest.example/images/social-share.jpg'],
      url: 'https://fest.example/',
      organizer: { '@type': 'Organization', name: 'GDG Example', url: 'https://gdg.example/' },
    });
  });

  it('leaves out the organizer URL when the site has none', () => {
    const { organizer } = eventStructuredData(
      { ...site, organizer: { name: 'GDG Example' } },
      resources,
    );

    expect(organizer).toEqual({ '@type': 'Organization', name: 'GDG Example' });
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so the data cannot end the script element', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' });

    expect(json).not.toContain('<');
    expect(JSON.parse(json)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});

describe('openGraphLocale', () => {
  it('uses an underscore between language and region', () => {
    expect(openGraphLocale('pt-BR')).toBe('pt_BR');
    expect(openGraphLocale('en')).toBe('en');
  });
});
