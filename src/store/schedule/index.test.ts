import { Initialized, Pending, Success } from '@abraham/remotedata';
import { orderBy } from 'firebase/firestore';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectScheduleState } from '.';
import { Day } from '../../models/day';
import { subscribeToCollection } from '../../utils/firestore';
import { RootState } from '..';

vi.mock('../../utils/firestore');
vi.mock('../dispatch');

describe('schedule', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectScheduleState', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToCollection).mockReturnValue(new Success(vi.fn()));
    const state = { schedule: new Initialized() } as unknown as RootState;

    expect(selectScheduleState(state)).toStrictEqual(new Pending());
    expect(subscribeToCollection).toHaveBeenCalledWith(
      'generatedSchedule',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      orderBy('date'),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as Day[];
    const state = { schedule: new Success(items) } as unknown as RootState;

    expect(selectScheduleState(state)).toStrictEqual(new Success(items));
  });
});
