import { Success } from '@abraham/remotedata';
import { describe, expect, it } from 'vitest';
import { selectPreviousSpeaker } from './selectors';
import type { PreviousSpeaker } from '../../models/previous-speaker';
import type { RootState } from '..';

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
