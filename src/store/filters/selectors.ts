import { Initialized, Success } from '@abraham/remotedata';
import { RootState } from '..';
import { parseFilters } from '../../utils/filters';
import { setFilters } from './actions';

export const selectFilters = (state: RootState) => {
  const { filters } = state;
  if (filters instanceof Success) {
    return filters.data;
  } else if (filters instanceof Initialized) {
    setFilters(parseFilters());
  }
  return [];
};
