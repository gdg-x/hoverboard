import { store } from '../';
import { Filter } from '../../models/filter';
import { SET_FILTERS } from './types';

export const setFilters = (filters: Filter[]) => {
  store.dispatch({
    type: SET_FILTERS,
    payload: filters,
  });
};
