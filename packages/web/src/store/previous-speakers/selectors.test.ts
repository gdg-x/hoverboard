import { Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { selectPreviousSpeaker, selectRandomPreviousSpeakers } from './selectors';
import { PreviousSpeaker } from '../../models/previous-speaker';
import { selectViewport } from '../ui';
import { RootState } from '..';

vi.mock('../ui');

const previousSpeakers: PreviousSpeaker[] = Array.from(
  { length: 20 },
  (_, index) =>
    ({
      id: `${index}`,
      name: `Speaker ${index}`,
    }) as unknown as PreviousSpeaker,
);

describe('selectPreviousSpeaker', () => {
  it('finds the previous speaker with the given id', () => {
    const state = { previousSpeakers: new Success(previousSpeakers) } as unknown as RootState;

    expect(selectPreviousSpeaker(state, '5')).toStrictEqual(previousSpeakers[5]);
  });

  it('returns undefined when no previous speaker matches', () => {
    const state = { previousSpeakers: new Success(previousSpeakers) } as unknown as RootState;

    expect(selectPreviousSpeaker(state, 'missing')).toBeUndefined();
  });
});

describe('selectRandomPreviousSpeakers', () => {
  it('returns 8 speakers on a phone viewport', () => {
    vi.mocked(selectViewport).mockReturnValue({
      isPhone: true,
      isTabletPlus: false,
      isLaptopPlus: false,
    });
    const state = { previousSpeakers: new Success(previousSpeakers) } as unknown as RootState;

    expect(selectRandomPreviousSpeakers(state)).toHaveLength(8);
  });

  it('returns 14 speakers on a larger viewport', () => {
    vi.mocked(selectViewport).mockReturnValue({
      isPhone: false,
      isTabletPlus: true,
      isLaptopPlus: false,
    });
    const state = { previousSpeakers: new Success(previousSpeakers) } as unknown as RootState;

    expect(selectRandomPreviousSpeakers(state)).toHaveLength(14);
  });
});
