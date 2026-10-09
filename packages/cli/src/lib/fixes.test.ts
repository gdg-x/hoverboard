import { describe, expect, it } from 'vitest';
import { DELETE, NOW, documentFixes, fieldUpdates } from './fixes.js';

const options = { timeZone: 'America/Los_Angeles' };
const speaker = {
  bio: '',
  company: '',
  companyLogo: '',
  companyLogoUrl: '',
  country: '',
  featured: false,
  name: 'Ada',
  photo: '',
  photoUrl: '',
  shortBio: '',
  socials: [],
  title: '',
};
const fixesOf = (path: string, json: unknown) =>
  documentFixes(path, json, options).map(({ segments, value, description }) => ({
    path: segments.join('/'),
    value,
    description,
  }));

describe('documentFixes', () => {
  it('trims spaces around a link', () => {
    const badges = [{ description: '', name: 'GDE', link: ' https://example.com ' }];
    expect(fixesOf('speakers/ada', { ...speaker, badges })).toEqual([
      {
        path: 'badges/0/link',
        value: 'https://example.com',
        description: 'badges[0].link " https://example.com " to "https://example.com"',
      },
    ]);
  });

  it('turns references into IDs, timestamps into dates and numeric strings into numbers', () => {
    expect(
      fixesOf('sessions/101', {
        title: 'Keynote',
        description: '',
        speakers: [{ $reference: 'speakers/ada' }, 'grace'],
        day: { $timestamp: '2027-10-15T03:00:00.000Z' },
      }),
    ).toEqual([
      // 03:00 UTC is still the day before in Los Angeles.
      expect.objectContaining({ path: 'day', value: '2027-10-14' }),
      expect.objectContaining({ path: 'speakers/0', value: 'ada' }),
    ]);
    const ticket = {
      available: true,
      currency: '$',
      info: '',
      name: 'Regular',
      price: '120',
      soldOut: false,
      url: '/',
    };
    expect(fixesOf('tickets/regular', ticket)).toEqual([
      expect.objectContaining({ path: 'price', value: 120 }),
    ]);
  });

  it('removes retired fields, but not other unknown fields', () => {
    expect(
      fixesOf('sessions/101', { title: 'Keynote', extend: 2, shortDescription: '', notes: '' }),
    ).toEqual([
      { path: 'extend', value: DELETE, description: 'extend removed' },
      { path: 'shortDescription', value: DELETE, description: 'shortDescription removed' },
    ]);
    expect(fixesOf('config/notifications', { icon: '/icon.png', timezone: 'UTC' })).toEqual([
      expect.objectContaining({ path: 'timezone', value: DELETE }),
    ]);
  });

  it('leaves what visitors wrote, and unknown collections, alone', () => {
    expect(
      fixesOf('subscribers/a', { email: 'ada@example.com', firstName: 3, lastName: '' }),
    ).toEqual([]);
    expect(fixesOf('misc/a', { link: ' x' })).toEqual([]);
  });

  it.each([
    ['subscribers/a', { email: 'ada.example.com', firstName: ' Ada', lastName: '' }],
    ['subscribers/a', { firstName: '', lastName: '' }],
    ['potentialPartners/a', { companyName: '', email: '<script>', fullName: '' }],
  ])('deletes %s without a valid email', (path, data) => {
    expect(fixesOf(path, data)).toEqual([
      { path: '', value: DELETE, description: 'deleted, since its email isn\u2019t valid' },
    ]);
  });

  it('removes null bookmarks, and keeps the others', () => {
    const bookmarks = { '101': null, '102': true, '103': null };
    const fixes = documentFixes('featuredSessions/uid', bookmarks, options);

    expect(fixes.map(({ segments, value }) => [segments.join('/'), value])).toEqual([
      ['101', DELETE],
      ['103', DELETE],
    ]);
    expect(fieldUpdates(bookmarks, fixes)).toEqual({ '101': DELETE, '103': DELETE });
  });

  it('sets a missing updatedAt to the current time, in visitor data too', () => {
    expect(fixesOf('notificationsSubscribers/token', { value: true })).toEqual([
      { path: 'updatedAt', value: NOW, description: 'updatedAt set to the current time' },
    ]);
  });

  it('has nothing left to fix after the fixes', () => {
    const raw = {
      ...speaker,
      badges: [
        { description: '', name: 'GDE', link: ' /about' },
        { description: '', name: 'GDG', link: 'https://example.com\n' },
      ],
    };
    const fixes = documentFixes('speakers/ada', raw, options);
    expect(fixes).toHaveLength(2);
    expect(documentFixes('speakers/ada', { ...raw, ...fieldUpdates(raw, fixes) }, options)).toEqual(
      [],
    );
  });
});

describe('fieldUpdates', () => {
  it('copies each changed top-level field, with every change in it', () => {
    const raw = {
      badges: [
        { name: 'a', link: ' x' },
        { name: 'b', link: ' y' },
      ],
      name: 'Ada',
      extend: 1,
    };
    expect(
      fieldUpdates(raw, [
        { segments: ['badges', '0', 'link'], value: 'x', description: '' },
        { segments: ['badges', '1', 'link'], value: 'y', description: '' },
        { segments: ['extend'], value: DELETE, description: '' },
      ]),
    ).toEqual({
      badges: [
        { name: 'a', link: 'x' },
        { name: 'b', link: 'y' },
      ],
      extend: DELETE,
    });
    expect(raw.badges[0]!.link).toBe(' x');
  });

  it('removes a nested field', () => {
    expect(
      fieldUpdates({ links: { old: 1, kept: 2 } }, [
        { segments: ['links', 'old'], value: DELETE, description: '' },
      ]),
    ).toEqual({ links: { kept: 2 } });
  });
});
