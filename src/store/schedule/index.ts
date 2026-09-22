import { orderBy } from 'firebase/firestore';
import { RootState } from '..';
import { CollectionState, createCollectionSlice } from '../create-collection-slice';
import { Day } from '../../models/day';
import { subscribeToCollection } from '../../utils/firestore';

export type ScheduleState = CollectionState<Day>;

const { reducer, selectOrFetch } = createCollectionSlice<Day>(
  'schedule',
  (onStart, onNext, onError) =>
    subscribeToCollection('generatedSchedule', onStart, onNext, onError, orderBy('date')),
);

export const selectScheduleState = (state: RootState): ScheduleState =>
  selectOrFetch(state.schedule);

export default reducer;
