import { describe, expect, it } from 'vitest';
import { location, url } from '../config/site';
import type { Session } from '../models/session';
import type { Speaker } from '../models/speaker';
import { getEventDates } from '../utils/dates';
import {
  initials,
  nameSize,
  sessionImage,
  socialImageMetadata,
  speakerImage,
  titleSize,
} from './social-images';

const speaker = (id: string, name: string, extra: Partial<Speaker> = {}) =>
  ({ id, name, company: '', photoUrl: `https://photos.test/${id}.jpg`, ...extra }) as Speaker;

const speakers = [
  speaker('ada', 'Ada Lovelace', { company: 'Analytical Engines' }),
  speaker('grace', 'Grace Hopper'),
  speaker('alan', 'Alan Turing'),
  speaker('katherine', 'Katherine Johnson'),
  speaker('dorothy', 'Dorothy Vaughan', { photoUrl: '' }),
];

const session = (extra: Partial<Session> = {}) =>
  ({
    id: 'keynote',
    title: 'Keynote',
    description: 'Opening',
    speakers: ['ada'],
    day: '2017-10-13',
    startTime: '10:30',
    track: 'conference-hall',
    ...extra,
  }) as Session;

const place = `${location!.name}, ${location!.short}`;
const host = new URL(url).host;

describe('titleSize', () => {
  it('steps down as titles get longer', () => {
    expect(titleSize('Keynote')).toBe(68);
    expect(titleSize('x'.repeat(40))).toBe(56);
    expect(titleSize('x'.repeat(100))).toBe(44);
  });
});

describe('nameSize', () => {
  it('steps down for long names', () => {
    expect(nameSize('Ada Lovelace')).toBe(68);
    expect(nameSize('Katherine Coleman Goble Johnson')).toBe(52);
  });
});

describe('initials', () => {
  it('takes the first letters of the first and last names', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('Ada King Lovelace')).toBe('AL');
    expect(initials('ada')).toBe('A');
    expect(initials('  ')).toBe('');
  });
});

describe('sessionImage', () => {
  it("shows the session's speaker, day, time, track and place", () => {
    const image = sessionImage(session(), speakers);

    expect(image).toMatchObject({
      kind: 'session',
      title: 'Keynote',
      titleSize: 68,
      speakers: [{ name: 'Ada Lovelace', initials: 'AL', photoUrl: 'https://photos.test/ada.jpg' }],
      moreSpeakers: 0,
      names: 'Ada Lovelace',
      company: 'Analytical Engines',
      details: 'Fri, Oct 13 · 10:30 · Conference hall',
      place,
      host,
    });
    expect(image.alt).toBe(
      `Keynote, by Ada Lovelace. Fri, Oct 13 · 10:30 · Conference hall. ${place}`,
    );
  });

  it('names up to three speakers, and counts the rest', () => {
    const image = sessionImage(
      session({ speakers: ['ada', 'grace', 'alan', 'katherine', 'dorothy'] }),
      speakers,
    );

    expect(image.speakers.map(({ name }) => name)).toEqual([
      'Ada Lovelace',
      'Grace Hopper',
      'Alan Turing',
    ]);
    expect(image.moreSpeakers).toBe(2);
    expect(image.names).toBe('Ada Lovelace, Grace Hopper, Alan Turing +2');
    expect(image).not.toHaveProperty('company');
    expect(image.alt).toContain(
      'by Ada Lovelace, Grace Hopper, Alan Turing, Katherine Johnson, and Dorothy Vaughan.',
    );
  });

  it('joins two or three names as a list', () => {
    const image = sessionImage(session({ speakers: ['grace', 'alan'] }), speakers);

    expect(image.names).toBe('Grace Hopper and Alan Turing');
  });

  it('leaves out speakers that are not in the content, and photos that are empty', () => {
    const image = sessionImage(session({ speakers: ['nobody', 'dorothy'] }), speakers);

    expect(image.speakers).toEqual([{ name: 'Dorothy Vaughan', initials: 'DV' }]);
  });

  it('has no speakers, and the title alone in the alt text, for a session without them', () => {
    const image = sessionImage(session({ speakers: [] }), speakers);

    expect(image.speakers).toEqual([]);
    expect(image.alt).toBe(`Keynote. Fri, Oct 13 · 10:30 · Conference hall. ${place}`);
  });

  it("shows the event's dates for a session without a day", () => {
    const { day: _, ...unscheduled } = session();

    expect(sessionImage(unscheduled as Session, speakers).details).toBe(getEventDates());
  });

  it('leaves out a track that is not in the schedule', () => {
    expect(sessionImage(session({ track: 'nowhere' }), speakers).details).toBe(
      'Fri, Oct 13 · 10:30',
    );
  });

  it('names the file after the session and a hash of what the image shows', () => {
    const image = sessionImage(session(), speakers);

    expect(image.file).toMatch(/^keynote-[0-9a-f]{8}$/);
    expect(image.path).toBe(`social/sessions/${image.file}.png`);
    expect(sessionImage(session(), speakers).file).toBe(image.file);
    expect(sessionImage(session({ description: 'Changed' }), speakers).file).toBe(image.file);
    expect(sessionImage(session({ title: 'Changed' }), speakers).file).not.toBe(image.file);
    expect(sessionImage(session({ startTime: '11:00' }), speakers).file).not.toBe(image.file);
    const renamed = speakers.map((item) =>
      item.id === 'ada' ? { ...item, name: 'Ada King' } : item,
    );
    expect(sessionImage(session(), renamed).file).not.toBe(image.file);
  });
});

describe('speakerImage', () => {
  it("shows the speaker's photo, name and company, and the event", () => {
    const image = speakerImage(speakers[0]!);

    expect(image).toMatchObject({
      kind: 'speaker',
      speaker: { name: 'Ada Lovelace', initials: 'AL', photoUrl: 'https://photos.test/ada.jpg' },
      nameSize: 68,
      company: 'Analytical Engines',
      details: getEventDates(),
      place,
      host,
    });
    expect(image.file).toMatch(/^ada-[0-9a-f]{8}$/);
    expect(image.path).toBe(`social/speakers/${image.file}.png`);
    expect(image.alt).toBe(
      `Ada Lovelace, Analytical Engines. Speaker at DevFest. ${getEventDates()}. ${place}`,
    );
  });

  it('leaves out an empty company', () => {
    const image = speakerImage(speakers[1]!);

    expect(image).not.toHaveProperty('company');
    expect(image.alt).toMatch(/^Grace Hopper\. Speaker at/);
  });

  it('changes the file name with the photo, and not with the bio', () => {
    const { file } = speakerImage(speakers[0]!);

    expect(speakerImage({ ...speakers[0]!, bio: 'Changed' }).file).toBe(file);
    expect(
      speakerImage({ ...speakers[0]!, photoUrl: 'https://photos.test/new.jpg' }).file,
    ).not.toBe(file);
  });
});

describe('socialImageMetadata', () => {
  it("is the image's absolute URL, type, size and alt text", () => {
    const image = speakerImage(speakers[0]!);

    expect(socialImageMetadata(image)).toEqual({
      image: new URL(image.path, url).href,
      imageAlt: image.alt,
      imageType: 'image/png',
      imageWidth: 1200,
      imageHeight: 630,
    });
  });
});
