import { msg } from '@lit/localize';
import { attendance, location } from '../config/site';

type Venue = NonNullable<typeof location>;

/** Where the event is: the venue as `describe` writes it, "Online", or both for a hybrid event. */
export const eventPlace = (describe: (venue: Venue) => string): string => {
  const online = msg('Online', { id: 'event.online' });
  if (!location) return online;
  const venue = describe(location);
  return attendance === 'hybrid' ? `${venue} · ${online}` : venue;
};
