import { Initialized, type RemoteData, Success } from '@abraham/remotedata';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
import type { Filter } from '../../models/filter';
import { dispatch } from '../dispatch';

export type FiltersState = RemoteData<Error, Filter[]>;

const initialState: FiltersState = new Initialized();

const slice = createSlice({
  name: 'filters',
  initialState: initialState as FiltersState,
  reducers: {
    set: (_state, action: PayloadAction<Filter[]>): FiltersState => new Success(action.payload),
  },
});

const { set } = slice.actions;

export const setFilters = (filters: Filter[]) => {
  dispatch(set(filters));
};

// Until the app applies the URL's filters after hydration, render unfiltered, as the server does.
export const selectFilters = (state: RootState) => {
  const { filters } = state;
  return filters instanceof Success ? filters.data : [];
};

export default slice.reducer;
