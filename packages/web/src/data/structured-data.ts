interface Venue {
  name: string;
  address: string;
  city: string;
}

interface EventSite {
  url: string;
  image: string;
  organizer: { name: string; url?: string };
  event: {
    startDate: string;
    endDate: string;
    attendance: 'inPerson' | 'online' | 'hybrid';
    stream?: string;
    location?: Venue;
  };
}

interface EventResources {
  title: string;
  description: string;
}

const ATTENDANCE_MODES = {
  inPerson: 'https://schema.org/OfflineEventAttendanceMode',
  online: 'https://schema.org/OnlineEventAttendanceMode',
  hybrid: 'https://schema.org/MixedEventAttendanceMode',
};

/** The venue, the stream, or both for a hybrid event. */
const eventLocation = ({ attendance, stream, location }: EventSite['event']) => {
  const places = [
    attendance !== 'online' && location
      ? {
          '@type': 'Place',
          name: location.name,
          address: {
            '@type': 'PostalAddress',
            streetAddress: location.address,
            addressLocality: location.city,
          },
        }
      : undefined,
    attendance !== 'inPerson' && stream ? { '@type': 'VirtualLocation', url: stream } : undefined,
  ].filter((place) => place !== undefined);
  return places.length === 1 ? places[0] : places;
};

/** The event as schema.org JSON-LD, for search results. See https://developers.google.com/search/docs/appearance/structured-data/event */
export const eventStructuredData = (site: EventSite, resources: EventResources) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: resources.title,
  description: resources.description,
  startDate: site.event.startDate,
  endDate: site.event.endDate,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: ATTENDANCE_MODES[site.event.attendance],
  location: eventLocation(site.event),
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
