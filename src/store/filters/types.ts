import { RemoteData } from '@abraham/remotedata';
import { Filter } from '../../models/filter';

export const SET_FILTERS = 'SET_FILTERS';

export type FiltersState = RemoteData<Error, Filter[]>;
interface SetFiltersAction {
  type: typeof SET_FILTERS;
  payload: Filter[];
}

export type FiltersActions = SetFiltersAction;
