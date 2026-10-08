interface EventSite {
  url: string;
  image: string;
  organizer: { name: string; url?: string };
  event: {
    startDate: string;
    endDate: string;
    location: { name: string; address: string; city: string };
  };
}

interface EventResources {
  title: string;
  description: string;
}

/** The event as schema.org JSON-LD, for search results. See https://developers.google.com/search/docs/appearance/structured-data/event */
export const eventStructuredData = (site: EventSite, resources: EventResources) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: resources.title,
  description: resources.description,
  startDate: site.event.startDate,
  endDate: site.event.endDate,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: site.event.location.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.event.location.address,
      addressLocality: site.event.location.city,
    },
  },
  image: [site.image],
  url: site.url,
  organizer: {
    '@type': 'Organization',
    name: site.organizer.name,
    ...(site.organizer.url ? { url: site.organizer.url } : {}),
  },
});

/** JSON for a script element. `<` is escaped, so the data cannot end the element. */
export const serializeJsonLd = (data: object): string =>
  JSON.stringify(data).replaceAll('<', '\\u003c');

/** Open Graph wants `language_TERRITORY`, such as `pt_BR`. */
export const openGraphLocale = (locale: string): string => locale.replace('-', '_');
