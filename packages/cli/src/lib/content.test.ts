import { describe, expect, it } from 'vitest';
import seed from '../../../../docs/default-firebase-data.json';
import { validateContent, validateSeedData } from './content.js';

const session = { title: 'Keynote', description: 'Opening talk' };

describe('validateSeedData', () => {
  it('accepts docs/default-firebase-data.json', () => {
    expect(() => validateSeedData(seed)).not.toThrow();
  });

  it('rejects unknown top-level collections', () => {
    expect(() => validateSeedData({ ...seed, triggers: {} })).toThrow('Invalid seed data');
  });
});

describe('validateContent', () => {
  it('accepts a valid document', () => {
    expect(() => validateContent('sessions', '101', session)).not.toThrow();
  });

  it('accepts import fields on sessions and speakers', () => {
    expect(() =>
      validateContent('sessions', '101', { ...session, source: 'sessionize', externalId: '42' }),
    ).not.toThrow();
  });

  it("accepts a session's day, times and track, all together or none", () => {
    const time = { day: '2027-10-15', startTime: '09:00', endTime: '09:40' };
    expect(() => validateContent('sessions', '101', { ...session, ...time })).not.toThrow();
    expect(() =>
      validateContent('sessions', '101', { ...session, ...time, track: 'main-hall' }),
    ).not.toThrow();
    expect(() => validateContent('sessions', '101', { ...session, day: '2027-10-15' })).toThrow(
      'sessions/101 must have properties startTime, endTime when property day is present',
    );
    expect(() =>
      validateContent('sessions', '101', { ...session, ...time, startTime: '9:00' }),
    ).toThrow('sessions/101/startTime must match pattern');
  });

  it('names the document and the problem when a document is invalid', () => {
    expect(() => validateContent('sessions', '101', { title: 'Keynote' })).toThrow(
      "Invalid sessions/101: sessions/101 must have required property 'description'",
    );
    expect(() => validateContent('sessions', '101', { ...session, speaker: 'ada' })).toThrow(
      'must NOT have additional properties',
    );
  });

  it('validates documents in subcollections', () => {
    expect(() => validateContent('team/0/members', '0', { name: 'Ada' })).toThrow(
      'Invalid team/0/members/0',
    );
  });

  it('rejects extra fields on partner groups and teams', () => {
    expect(() => validateContent('team', '0', { title: 'Organizers' })).not.toThrow();
    expect(() => validateContent('team', '0', { title: 'Organizers', members: [] })).toThrow(
      'must NOT have unevaluated properties',
    );
  });

  it('passes documents outside the content collections', () => {
    expect(() => validateContent('config', 'mailchimp', { apikey: '' })).not.toThrow();
    expect(() => validateContent('featuredSessions', 'user', { 101: true })).not.toThrow();
  });
});
