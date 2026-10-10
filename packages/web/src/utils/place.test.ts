import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventPlace } from './place';

const config = vi.hoisted(() => ({
  attendance: 'inPerson' as 'inPerson' | 'online' | 'hybrid',
}));

vi.mock('../config/site', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config/site')>();
  return {
    ...actual,
    get attendance() {
      return config.attendance;
    },
    get location() {
      return config.attendance === 'online' ? undefined : actual.location;
    },
  };
});

describe('eventPlace', () => {
  afterEach(() => {
    config.attendance = 'inPerson';
  });

  it('names the venue in person', () => {
    expect(eventPlace(({ short }) => short)).toBe('Lviv, Ukraine');
  });

  it('says online without a venue', () => {
    config.attendance = 'online';

    expect(eventPlace(({ short }) => short)).toBe('Online');
  });

  it('names both for a hybrid event', () => {
    config.attendance = 'hybrid';

    expect(eventPlace(({ name }) => name)).toBe('Planeta kino · Online');
  });
});
