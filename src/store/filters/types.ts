import { RemoteData } from '@abraham/remotedata';
import { Filter } from '../../models/filter';

export const FILTERS = 'FILTERS';
export const SET_FILTERS = 'SET_FILTERS';

export type FiltersState = RemoteData<Error, Filter[]>;
interface FiltersAction {
  type: typeof FILTERS;
}

interface SetFiltersAction {
  type: typeof SET_FILTERS;
  payload: Filter[];
}

export type FiltersActions = FiltersAction | SetFiltersAction;
