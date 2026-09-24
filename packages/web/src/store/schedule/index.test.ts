import { Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import reducer, { selectScheduleState } from '.';
import { Day } from '../../models/day';
import { subscribeToSchedule } from '../../db/schedule';
import { RootState } from '..';

vi.mock('../../db/schedule');
vi.mock('../dispatch');

describe('schedule', () => {
  it('starts in the Initialized state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(new Initialized());
  });
});

describe('selectScheduleState', () => {
  it('subscribes on first read', () => {
    vi.mocked(subscribeToSchedule).mockReturnValue(new Success(vi.fn()));
    const state = { schedule: new Initialized() } as unknown as RootState;

    expect(selectScheduleState(state)).toStrictEqual(new Pending());
    expect(subscribeToSchedule).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('returns the existing state without re-fetching once loaded', () => {
    const items = [{ id: '1' }] as unknown as Day[];
    const state = { schedule: new Success(items) } as unknown as RootState;

    expect(selectScheduleState(state)).toStrictEqual(new Success(items));
  });
});
