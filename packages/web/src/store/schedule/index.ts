import type { RootState } from '..';
import { type CollectionState, createCollectionSlice } from '../create-collection-slice';
import type { Day } from '../../models/day';
import { subscribeToSchedule } from '../../db/schedule';

export type ScheduleState = CollectionState<Day>;

const { reducer, selectOrFetch } = createCollectionSlice<Day>('schedule', subscribeToSchedule);

export const selectScheduleState = (state: RootState): ScheduleState =>
  selectOrFetch(state.schedule);

export default reducer;
