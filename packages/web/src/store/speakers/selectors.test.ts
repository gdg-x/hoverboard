import { Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { selectFilteredSpeakers, selectSpeaker } from './selectors';
import type { Session } from '../../models/session';
import type { Speaker } from '../../models/speaker';
import { FilterGroupKey } from '../../models/filter-group';
import { selectFilters } from '../filters';
import type { RootState } from '..';

vi.mock('../filters');

const speakers = [
  { id: '1', name: 'Ada' },
  { id: '2', name: 'Grace' },
] as Speaker[];

const sessions: Session[] = [
  { id: 'a', title: 'Keynote', description: '', speakers: ['1'], tags: ['Keynote'] },
  { id: 'b', title: 'Workshop', description: '', speakers: ['2'], tags: ['Workshop'] },
];

const state = {
  sessions: new Success(sessions),
  speakers: new Success(speakers),
} as unknown as RootState;

describe('selectSpeaker', () => {
  it('finds the speaker with the given id, with their sessions and tags', () => {
    expect(selectSpeaker(state, '2')).toMatchObject({
      id: '2',
      name: 'Grace',
      tags: ['Workshop'],
      sessions: [{ id: 'b' }],
    });
  });

  it('returns undefined when no speaker matches', () => {
    expect(selectSpeaker(state, 'missing')).toBeUndefined();
  });
});

describe('selectFilteredSpeakers', () => {
  it('returns every speaker when there are no selected filters', () => {
    vi.mocked(selectFilters).mockReturnValue([]);

    expect(selectFilteredSpeakers(state).map(({ id }) => id)).toStrictEqual(['1', '2']);
  });

  it('returns only speakers whose tags match a selected filter', () => {
    vi.mocked(selectFilters).mockReturnValue([{ group: FilterGroupKey.tags, tag: 'keynote' }]);

    // A new state object, or the selector returns its result for the last one.
    expect(selectFilteredSpeakers({ ...state }).map(({ id }) => id)).toStrictEqual(['1']);
  });
});
