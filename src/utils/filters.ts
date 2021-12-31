import { Filter } from '../models/filter';
import { FilterGroupKey } from '../models/filter-group';
import { setQueryString } from './functions';

export const parseFilters = (): Filter[] => {
  const { search } = window.location;
  const searchParams = new URLSearchParams(search);
  const tags = searchParams.getAll(FilterGroupKey.tags).map((tag) => {
    return { group: FilterGroupKey.tags, tag };
  });
  const complexities = searchParams.getAll(FilterGroupKey.complexity).map((tag) => {
    return { group: FilterGroupKey.complexity, tag };
  });
  return [...tags, ...complexities];
};

const matchingFilter = (filterA: Filter, filterB: Filter) => {
  return filterA.tag === filterB.tag && filterA.group === filterB.group;
};

export const toggleFilter = (filter: Filter): void => {
  let filters = parseFilters();
  if (filters.some((item) => matchingFilter(filter, item))) {
    filters = filters.filter((item) => !matchingFilter(filter, item));
  } else {
    filters.push(filter);
  }
  const queryString = filters.map(({ group, tag }) => `${group}=${tag}`).join('&');
  setQueryString(queryString);
};
