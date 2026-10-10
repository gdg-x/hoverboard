import { msg, str } from '@lit/localize';
import { createHash } from 'node:crypto';
import { designKey } from 'virtual:hoverboard/social-images';
import { disabledSchedule, location, scheduleTracks, shortName, url } from '../config/site';
import type { Session } from '../models/session';
import type { Speaker } from '../models/speaker';
import { getEventDates } from '../utils/dates';
import { getLocale } from '../utils/localization';

export const SOCIAL_IMAGE = { width: 1200, height: 630, type: 'image/png' } as const;

// Change it when the layout changes, so every image gets a new file name.
const LAYOUT_VERSION = 1;
const MAX_SPEAKERS = 3;

export interface SocialImagePerson {
  name: string;
  initials: string;
  photoUrl?: string;
}

interface SocialImageBase {
  /** `<id>-<hash>`, the endpoint's `[file]`. The hash changes with anything the image shows. */
  file: string;
  /** From the site's root, for example `social/sessions/intro-1a2b3c4d.png`. */
  path: string;
  alt: string;
  /** When: the session's day, time and track, or the event's dates. */
  details: string;
  place: string;
  /** The site's address without `https://`. */
  host: string;
}

export interface SessionImage extends SocialImageBase {
  kind: 'session';
  title: string;
  titleSize: number;
  /** The first three. */
  speakers: SocialImagePerson[];
  moreSpeakers: number;
  names: string;
  /** Only with one speaker. */
  company?: string;
}

export interface SpeakerImage extends SocialImageBase {
  kind: 'speaker';
  speaker: SocialImagePerson;
  nameSize: number;
  company?: string;
}

export type SocialImage = SessionImage | SpeakerImage;

type Model<T extends SocialImage> = Omit<T, 'file' | 'path'>;

/** Long titles get smaller type, so more of them fits in three lines. */
export const titleSize = (title: string): number =>
  title.length <= 32 ? 68 : title.length <= 64 ? 56 : 44;

export const nameSize = (name: string): number => (name.length <= 18 ? 68 : 52);

/** The first letters of the first and last names. */
export const initials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const ends = words.length > 1 ? [words[0], words.at(-1)] : words.slice(0, 1);
  return ends.map((word) => [...(word ?? '')][0]?.toLocaleUpperCase() ?? '').join('');
};

const person = ({ name, photoUrl }: Speaker): SocialImagePerson => ({
  name: name.trim(),
  initials: initials(name),
  ...(photoUrl ? { photoUrl } : {}),
});

const place = () => [location.name, location.short].filter(Boolean).join(', ');

const host = () => new URL(url).host;

/** The session's day, start time and track in the event's time zone, or the event's dates. */
export const sessionDetails = ({ day, startTime, track }: Session): string => {
  if (disabledSchedule || !day) return getEventDates();
  const date = new Intl.DateTimeFormat(getLocale(), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00Z`));
  const trackTitle = scheduleTracks.find(({ id }) => id === track)?.title;
  return [date, startTime, trackTitle].filter(Boolean).join(' · ');
};

const withFile = <T extends SocialImage>(collection: string, id: string, model: Model<T>): T => {
  const hash = createHash('sha256')
    .update(JSON.stringify([LAYOUT_VERSION, designKey, model]))
    .digest('hex')
    .slice(0, 8);
  const file = `${id}-${hash}`;
  return { ...model, file, path: `social/${collection}/${file}.png` } as T;
};

/** A session's share image: its title, speakers, time and track. */
export const sessionImage = (session: Session, allSpeakers: readonly Speaker[]): SessionImage => {
  const speakers = (session.speakers ?? []).flatMap((id) =>
    allSpeakers.filter((speaker) => speaker.id === id),
  );
  const shown = speakers.slice(0, MAX_SPEAKERS).map(person);
  const list = new Intl.ListFormat(getLocale(), { type: 'conjunction' });
  const moreSpeakers = speakers.length - shown.length;
  const names = moreSpeakers
    ? `${shown.map(({ name }) => name).join(', ')} +${moreSpeakers}`
    : list.format(shown.map(({ name }) => name));
  const details = sessionDetails(session);
  const by = list.format(speakers.map(({ name }) => name.trim()));
  const company = speakers.length === 1 ? speakers[0]?.company.trim() : undefined;
  const title = session.title.trim();
  return withFile<SessionImage>('sessions', session.id, {
    kind: 'session',
    title,
    titleSize: titleSize(title),
    speakers: shown,
    moreSpeakers,
    names,
    ...(company ? { company } : {}),
    details,
    place: place(),
    host: host(),
    alt: [
      speakers.length ? msg(str`${title}, by ${by}`, { id: 'social-image.session.alt' }) : title,
      details,
      place(),
    ].join('. '),
  });
};

/** A speaker's share image: their photo, name and company, and the event's dates. */
export const speakerImage = (speaker: Speaker): SpeakerImage => {
  const details = getEventDates();
  const { name } = person(speaker);
  const company = speaker.company.trim();
  return withFile<SpeakerImage>('speakers', speaker.id, {
    kind: 'speaker',
    speaker: person(speaker),
    nameSize: nameSize(name),
    ...(company ? { company } : {}),
    details,
    place: place(),
    host: host(),
    alt: [
      company ? `${name}, ${company}` : name,
      msg(str`Speaker at ${shortName}`, { id: 'social-image.speaker.alt' }),
      details,
      place(),
    ].join('. '),
  });
};

/** The layout's image tags for a share image. */
export const socialImageMetadata = (image: SocialImage) => ({
  image: new URL(image.path, url).href,
  imageAlt: image.alt,
  imageType: SOCIAL_IMAGE.type,
  imageWidth: SOCIAL_IMAGE.width,
  imageHeight: SOCIAL_IMAGE.height,
});
