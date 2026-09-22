import { Initialized, RemoteData, Success } from '@abraham/remotedata';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { Filter } from '../../models/filter';
import { parseFilters } from '../../utils/filters';
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

export const selectFilters = (state: RootState) => {
  const { filters } = state;
  if (filters instanceof Success) {
    return filters.data;
  } else if (filters instanceof Initialized) {
    setFilters(parseFilters());
  }
  return [];
};

export default slice.reducer;
