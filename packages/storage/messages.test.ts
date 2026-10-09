import { Ajv2020 } from 'ajv/dist/2020.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { documentProblems, documentUrl, fieldPath } from './messages';

const schema = JSON.parse(
  readFileSync(join(import.meta.dirname, 'schemas/firestore.schema.json'), 'utf8'),
) as { $id: string };
const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true, verbose: true });
ajv.addSchema(schema);

/** The messages for `data` as a document of the `$defs` definition `definition`. */
const problems = (definition: string, data: unknown, options = {}) => {
  const validate = ajv.getSchema(`${schema.$id}#/$defs/${definition}`)!;
  validate(data);
  return documentProblems('doc/1', validate.errors, options);
};

const session = { title: 'Keynote', description: 'Opening talk' };
const time = { day: '2027-10-15', startTime: '09:00', endTime: '09:40' };
const feedback = { contentRating: 4, styleRating: 5, comment: '', userId: 'ada' };

describe('documentProblems', () => {
  it('has no messages for a valid document', () => {
    expect(problems('session', session)).toEqual([]);
  });

  it.each([
    ['required', 'session', { title: 'Keynote' }, 'missing "description".'],
    [
      'additionalProperties',
      'session',
      { ...session, extend: 2 },
      'unknown field "extend". Hoverboard doesn\'t read it.',
    ],
    [
      'unevaluatedProperties',
      'teamDocument',
      { title: 'Organizers', members: [] },
      'unknown field "members". Hoverboard doesn\'t read it.',
    ],
    ['dependentRequired', 'session', { ...session, track: 'main' }, '"track" needs "day" too.'],
    ['type', 'session', { ...session, title: 3 }, 'title must be a string, not a number.'],
    [
      'type with several types',
      'photo',
      { url: '/a.jpg', order: true },
      'order must be a number or a string, not a boolean. Sort position. Lower comes first.',
    ],
    [
      'type with a reference',
      'session',
      { ...session, speakers: [{ $reference: 'speakers/ada' }] },
      'speakers[0] is a reference to speakers/ada. It must be the ID "ada".',
    ],
    [
      'type with a timestamp',
      'post',
      {
        backgroundColor: '',
        brief: '',
        content: '',
        image: '/a.jpg',
        title: '',
        published: { $timestamp: '2027-10-15T00:00:00Z' },
      },
      'published must be a string, not a timestamp.',
    ],
    [
      'pattern on a link',
      'photo',
      { url: 'javascript:alert(1)', order: 0 },
      'url "javascript:alert(1)" must start with https://, http://, mailto: or /, with no spaces or line breaks around it.',
    ],
    [
      'pattern on a date',
      'session',
      { ...session, ...time, day: '15/10/2027' },
      'day "15/10/2027" must be a date, YYYY-MM-DD.',
    ],
    [
      'pattern on a time',
      'session',
      { ...session, ...time, startTime: '9:00' },
      'startTime "9:00" must be a time, HH:MM.',
    ],
    [
      'propertyNames',
      'previousSpeaker',
      {
        bio: '',
        company: '',
        country: '',
        id: 'ada',
        name: '',
        order: 0,
        photoUrl: '',
        socials: [],
        title: '',
        sessions: { '20x': [] },
      },
      'sessions has a key that isn\'t allowed: "20x".',
    ],
    [
      'maximum',
      'feedback',
      { ...feedback, contentRating: 6 },
      'contentRating 6 must be at most 5.',
    ],
    ['minimum', 'feedback', { ...feedback, styleRating: -1 }, 'styleRating -1 must be at least 0.'],
    [
      'maxLength',
      'feedback',
      { ...feedback, comment: 'x'.repeat(257) },
      'comment is longer than 256 characters.',
    ],
    [
      'maxProperties',
      'featuredSessions',
      Object.fromEntries(Array.from({ length: 501 }, (_, index) => [index, true])),
      'The document has more than 500 entries.',
    ],
    [
      'const',
      'notificationsUser',
      { tokens: { 'token-1': false } },
      'tokens.token-1 false must be true.',
    ],
  ])('explains %s', (_keyword, definition, data, message) => {
    expect(problems(definition, data)).toContain(`doc/1: ${message}`);
  });

  it('cuts long values', () => {
    const [message] = problems('photo', {
      url: ` https://example.com/${'a'.repeat(80)}`,
      order: 0,
    });
    expect(message).toContain(`url " https://example.com/${'a'.repeat(37)}… must start with`);
  });

  it('leaves values out for personal data', () => {
    expect(
      problems(
        'subscriber',
        { email: 'ada.example.com', firstName: '', lastName: '' },
        {
          hideValues: true,
        },
      ),
    ).toEqual(['doc/1: email must be an email address.']);
  });

  it('leaves map keys and references out for personal data', () => {
    const hidden = { hideValues: true };
    expect(problems('notificationsUser', { tokens: { 'secret-token': false } }, hidden)).toEqual([
      'doc/1: tokens.* must be true.',
    ]);
    expect(problems('featuredSessions', { '101': null }, hidden)).toEqual([
      'doc/1: An entry must be a boolean, not null.',
    ]);
    expect(
      problems('feedback', { ...feedback, userId: { $reference: 'users/ada' } }, hidden),
    ).toEqual(['doc/1: userId must be a string, not a reference.']);
  });

  it('ends each message with the link', () => {
    expect(problems('session', { title: 'Keynote' }, { url: 'https://example.com' })).toEqual([
      'doc/1: missing "description". https://example.com',
    ]);
  });

  it('adds the field description when there is one', () => {
    expect(problems('post', { ...session }).join('\n')).toContain('doc/1: missing "published".');
    const validate = ajv.getSchema(`${schema.$id}#/$defs/session`)!;
    validate({ ...session, track: 3, day: '2027-10-15', startTime: '09:00', endTime: '10:00' });
    expect(documentProblems('doc/1', validate.errors)).toEqual([
      'doc/1: track must be a string, not a number. A track ID from `schedule.tracks` in site.json. Without it, the session spans every track.',
    ]);
  });

  it('falls back to Ajv\u2019s message for other keywords', () => {
    expect(
      documentProblems('doc/1', [
        {
          keyword: 'format',
          instancePath: '/at',
          schemaPath: '#/format',
          params: { format: 'date-time' },
          message: 'must match format "date-time"',
        },
      ]),
    ).toEqual(['doc/1: at must match format "date-time".']);
  });
});

describe('fieldPath', () => {
  it.each([
    ['', ''],
    ['/title', 'title'],
    ['/badges/1/link', 'badges[1].link'],
    ['/tokens/a~1b', 'tokens.a/b'],
  ])('turns %j into %j', (pointer, path) => {
    expect(fieldPath(pointer)).toBe(path);
  });
});

describe('documentUrl', () => {
  it('links to the Firebase console for a project', () => {
    expect(documentUrl('sessions/107', 'hoverboard-master')).toBe(
      'https://console.firebase.google.com/project/hoverboard-master/firestore/databases/-default-/data/~2Fsessions~2F107',
    );
  });

  it('links to the Emulator UI without one', () => {
    expect(documentUrl('team/core/members/ada')).toBe(
      'http://127.0.0.1:4000/firestore/default/data/team/core/members/ada',
    );
  });

  it('encodes IDs', () => {
    expect(documentUrl('speakers/a b', 'demo')).toContain('~2Fspeakers~2Fa%20b');
  });
});
