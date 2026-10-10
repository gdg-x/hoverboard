import { describe, expect, it } from 'vitest';
import { eventStructuredData, openGraphLocale, serializeJsonLd } from './structured-data';

const site = {
  url: 'https://fest.example/',
  image: 'https://fest.example/images/social-share.jpg',
  organizer: { name: 'GDG Example', url: 'https://gdg.example/' },
  event: {
    startDate: '2027-10-15',
    endDate: '2027-10-16',
    attendance: 'inPerson' as const,
    location: { name: 'Hall', address: '1 Main Street, City', city: 'City' },
  },
};
const resources = { title: 'Example Fest', description: 'A conference' };
const hall = {
  '@type': 'Place',
  name: 'Hall',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1 Main Street, City',
    addressLocality: 'City',
  },
};
const stream = 'https://www.youtube.com/@example/live';

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

  it('places an online event at its stream, even with a venue in the config', () => {
    const data = eventStructuredData(
      { ...site, event: { ...site.event, attendance: 'online', stream } },
      resources,
    );

    expect(data.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
    expect(data.location).toEqual({ '@type': 'VirtualLocation', url: stream });
  });

  it('places a hybrid event at its venue and its stream', () => {
    const hybrid = (extra: { stream?: string }) =>
      eventStructuredData(
        { ...site, event: { ...site.event, attendance: 'hybrid', ...extra } },
        resources,
      );

    expect(hybrid({ stream }).eventAttendanceMode).toBe(
      'https://schema.org/MixedEventAttendanceMode',
    );
    expect(hybrid({ stream }).location).toEqual([
      hall,
      { '@type': 'VirtualLocation', url: stream },
    ]);
    expect(hybrid({}).location).toEqual(hall);
  });

  it('names no stream for an in-person event', () => {
    const { location } = eventStructuredData(
      { ...site, event: { ...site.event, stream } },
      resources,
    );

    expect(location).toEqual(hall);
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
