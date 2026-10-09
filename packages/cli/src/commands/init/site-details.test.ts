import { describe, expect, it, vi } from 'vitest';
import {
  applySiteDetails,
  askSiteDetails,
  currentDetails,
  isDate,
  isTimeZone,
  type SiteDetails,
  withDependents,
} from './site-details.js';

const REQUIRES = { feedback: ['schedule'], mySchedule: ['schedule'], schedule: ['speakers'] };
const FEATURES = ['feedback', 'forkMe', 'map', 'mySchedule', 'schedule', 'speakers'];

const site = {
  firebase: { projectId: 'old-project' },
  url: 'https://old.example/',
  shortName: 'Old',
  organizer: { name: 'Old organizer', email: 'old@example.com', twitter: 'old' },
  event: {
    startDate: '2017-10-13',
    endDate: '2017-10-14',
    timezone: 'Europe/Kyiv',
    location: {
      name: 'Old venue',
      city: 'Lviv',
      short: 'Lviv, Ukraine',
      address: '1 Old Street',
      pointer: { latitude: 49.8, longitude: 23.9, zoom: 5 },
      mapCenter: { latitude: 48, longitude: 8 },
    },
  },
  social: { hashtag: 'Old', follow: [{ name: 'x', url: 'https://x.com/old' }] },
  integrations: { googleMapsApiKey: 'old-key' },
  auth: { providers: ['emailLink', 'google'] },
  features: { forkMe: true },
  theme: { name: 'festival', tagColors: { web: '#2196f3' } },
};
const resources = { title: 'Old Fest', description: 'Old', heroDescriptions: { home: 'Old' } };
const THEMES = ['festival', 'spotlight'];

const details: SiteDetails = {
  title: 'New Fest',
  description: 'A new conference',
  shortName: 'New Fest',
  startDate: '2027-10-15',
  endDate: '2027-10-16',
  timezone: 'America/New_York',
  venue: 'Hall',
  address: '1 Main Street',
  city: 'Springfield',
  shortLocation: 'Springfield, USA',
  organizerName: 'GDG Springfield',
  organizerEmail: 'hi@example.com',
  featuresOff: ['forkMe'],
  map: { apiKey: 'new-key', latitude: 40.1, longitude: -74.2 },
};

const apply = (overrides: Partial<SiteDetails> = {}, newProject = true) =>
  applySiteDetails(
    site,
    resources,
    { ...details, ...overrides },
    { projectId: 'new-project', newProject, features: FEATURES, requires: REQUIRES },
  );

describe('validators', () => {
  it('accepts real dates only', () => {
    expect(isDate('2027-10-15')).toBe(true);
    expect(isDate('2027-02-30')).toBe(false);
    expect(isDate('15/10/2027')).toBe(false);
  });

  it('accepts IANA time zones', () => {
    expect(isTimeZone('Europe/Kyiv')).toBe(true);
    expect(isTimeZone('UTC')).toBe(true);
    expect(isTimeZone('Mars/Olympus')).toBe(false);
    expect(isTimeZone('EST')).toBe(false);
  });
});

describe('withDependents', () => {
  it('turns off the features that need a feature that is off', () => {
    expect(withDependents(['speakers'], REQUIRES)).toEqual([
      'feedback',
      'mySchedule',
      'schedule',
      'speakers',
    ]);
  });
});

describe('currentDetails', () => {
  const features = { feedback: true, forkMe: true, map: true, mySchedule: true, schedule: true };

  it('keeps the URL and Maps key when the project stays', () => {
    const current = currentDetails({ site, resources, features, newProject: false });

    expect(current).toMatchObject({
      title: 'Old Fest',
      url: 'https://old.example/',
      theme: 'festival',
      featuresOff: [],
      map: { apiKey: 'old-key', latitude: 49.8, longitude: 23.9 },
    });
  });

  it('drops the old project values and the fork me ribbon for a new project', () => {
    const current = currentDetails({ site, resources, features, newProject: true });

    expect(current.url).toBeUndefined();
    expect(current.map).toBeUndefined();
    expect(current.featuresOff).toEqual(['forkMe']);
  });
});

describe('applySiteDetails', () => {
  it('writes the details and keeps what the wizard does not ask for', () => {
    const { site: next, resources: nextResources } = apply();

    expect(next).toMatchObject({
      firebase: { projectId: 'new-project' },
      shortName: 'New Fest',
      organizer: { name: 'GDG Springfield', email: 'hi@example.com' },
      event: {
        startDate: '2027-10-15',
        endDate: '2027-10-16',
        timezone: 'America/New_York',
        location: {
          name: 'Hall',
          address: '1 Main Street',
          city: 'Springfield',
          short: 'Springfield, USA',
          pointer: { latitude: 40.1, longitude: -74.2, zoom: 5 },
          mapCenter: { latitude: 40.1, longitude: -74.2 },
        },
      },
      integrations: { googleMapsApiKey: 'new-key' },
      theme: { name: 'festival', tagColors: { web: '#2196f3' } },
    });
    expect(nextResources).toEqual({
      title: 'New Fest',
      description: 'A new conference',
      heroDescriptions: { home: 'A new conference' },
    });
  });

  it("clears the old project's organizer links, social links and URL", () => {
    const { site: next } = apply();

    expect(next['organizer']).toEqual({ name: 'GDG Springfield', email: 'hi@example.com' });
    expect(next['social']).toEqual({ hashtag: 'NewFest', follow: [] });
    expect(next).not.toHaveProperty('url');
  });

  it('starts a new project with the default sign-in, and keeps it when the project stays', () => {
    expect(apply().site).not.toHaveProperty('auth');
    expect(apply({}, false).site['auth']).toEqual(site.auth);
  });

  it('keeps the organizer and social links when the project stays', () => {
    const { site: next } = apply({}, false);

    expect(next['organizer']).toMatchObject({ twitter: 'old' });
    expect(next['social']).toEqual(site.social);
  });

  it('keeps a custom URL', () => {
    expect(apply({ url: 'https://fest.example/' }).site['url']).toBe('https://fest.example/');
  });

  it('sets the theme and keeps the other theme settings', () => {
    expect(apply({ theme: 'spotlight' }).site['theme']).toEqual({
      name: 'spotlight',
      tagColors: { web: '#2196f3' },
    });
  });

  it('lists every feature, with the dependents of features that are off', () => {
    const { site: next } = apply({ featuresOff: ['schedule'] });

    expect(next['features']).toEqual({
      feedback: false,
      forkMe: true,
      map: true,
      mySchedule: false,
      schedule: false,
      speakers: true,
    });
  });

  it('removes the Maps key when the map is off', () => {
    const { site: next } = apply({ featuresOff: ['map'] });

    expect(next).not.toHaveProperty('integrations');
    expect((next['features'] as Record<string, boolean>)['map']).toBe(false);
  });
});

describe('askSiteDetails', () => {
  const answering = (answers: Record<string, string[]>) =>
    vi.fn(async (question: string, defaultValue = '') => {
      const key = Object.keys(answers).find((prefix) => question.startsWith(prefix));
      const next = key ? answers[key]!.shift() : undefined;
      return next || defaultValue;
    });

  it('asks again until an answer is valid, and keeps the defaults otherwise', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const ask = answering({
      'First day': ['tomorrow', '2027-10-15'],
      'Last day': ['2027-10-14', '2027-10-16'],
      'Features to turn off': ['forkMe, nope', 'forkMe'],
      Theme: ['default', 'spotlight'],
    });

    const answers = await askSiteDetails(
      ask,
      { ...details, map: undefined },
      'new-project',
      FEATURES,
      THEMES,
    );

    expect(answers).toMatchObject({
      title: 'New Fest',
      startDate: '2027-10-15',
      endDate: '2027-10-16',
      theme: 'spotlight',
      featuresOff: ['forkMe', 'map'],
    });
    expect(answers).not.toHaveProperty('url');
    expect(ask).toHaveBeenCalledWith('First day (YYYY-MM-DD):', '2027-10-15');
    expect(ask).toHaveBeenCalledWith('Theme (festival or spotlight):', 'festival');
  });

  it('asks for the venue coordinates when the map has a key', async () => {
    const ask = answering({
      'Google Maps API key': ['key'],
      'Venue latitude': ['91', '40.5'],
      'Venue longitude': ['-74'],
    });

    const answers = await askSiteDetails(ask, details, 'new-project', FEATURES, THEMES);

    expect(answers.map).toEqual({ apiKey: 'key', latitude: 40.5, longitude: -74 });
    expect(answers.featuresOff).toEqual(['forkMe']);
  });
});
