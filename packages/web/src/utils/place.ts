import { msg } from '@lit/localize';
import { attendance, location } from '../config/site';

type Venue = NonNullable<typeof location>;

/** How people attend, and the venue unless it's online. */
export interface Attending {
  attendance: typeof attendance;
  location: typeof location;
}

/** Where the event is: the venue as `describe` writes it, "Online", or both for a hybrid event. */
export const eventPlace = (
  describe: (venue: Venue) => string,
  where: Attending = { attendance, location },
): string => {
  const online = msg('Online', { id: 'event.online' });
  if (!where.location) return online;
  const venue = describe(where.location);
  return where.attendance === 'hybrid' ? `${venue} · ${online}` : venue;
};
