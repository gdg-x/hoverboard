import { Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { selectFilteredSpeakers, selectSpeaker } from './selectors';
import { SpeakerWithTags } from '../../models/speaker';
import { FilterGroupKey } from '../../models/filter-group';
import { selectFilters } from '../filters';
import { RootState } from '..';

vi.mock('../filters');

const speakers: SpeakerWithTags[] = [
  { id: '1', name: 'Ada', tags: ['Keynote'] } as unknown as SpeakerWithTags,
  { id: '2', name: 'Grace', tags: ['Workshop'] } as unknown as SpeakerWithTags,
];

describe('selectSpeaker', () => {
  it('finds the speaker with the given id', () => {
    const state = { speakers: new Success(speakers) } as unknown as RootState;

    expect(selectSpeaker(state, '2')).toStrictEqual(speakers[1]);
  });

  it('returns undefined when no speaker matches', () => {
    const state = { speakers: new Success(speakers) } as unknown as RootState;

    expect(selectSpeaker(state, 'missing')).toBeUndefined();
  });
});

describe('selectFilteredSpeakers', () => {
  it('returns every speaker when there are no selected filters', () => {
    vi.mocked(selectFilters).mockReturnValue([]);
    const state = { speakers: new Success(speakers) } as unknown as RootState;

    expect(selectFilteredSpeakers(state)).toStrictEqual(speakers);
  });

  it('returns only speakers whose tags match a selected filter', () => {
    vi.mocked(selectFilters).mockReturnValue([{ group: FilterGroupKey.tags, tag: 'keynote' }]);
    const state = { speakers: new Success(speakers) } as unknown as RootState;

    expect(selectFilteredSpeakers(state)).toStrictEqual([speakers[0]]);
  });
});
