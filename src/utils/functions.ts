import { PolymerElement } from '@polymer/polymer';
import { Filter } from '../models/filter';
import { FilterGroupKey } from '../models/filter-group';
import { TempAny } from '../temp-any';

export const getDate = (date) => {
  return new Date(date).toLocaleString('{$ dateFormat.locale $}', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const isEmpty = (array) => {
  return !array || !array.length;
};

export const randomOrder = <T>(array: T[]): T[] => {
  return array.sort(() => 0.5 - Math.random());
};

export const generateClassName = (value: string): string => {
  return value
    ? value
        .replace(/\W+/g, '-')
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .toLowerCase()
    : '';
};

export const getVariableColor = (element: PolymerElement, value: string, fallback?: string) => {
  const calculated = (window as TempAny).ShadyCSS
    ? (window as TempAny).ShadyCSS.getComputedStyleValue(element, `--${generateClassName(value)}`)
    : getComputedStyle(element, `--${generateClassName(value)}`);
  return calculated || (fallback && getVariableColor(element, fallback));
};

export const parseQueryParamsFilters = (queryParams: string): { sessionId?: number } => {
  return queryParams
    .split('&')
    .map((query) => query.split('='))
    .filter((filter) => filter[0] && filter[1])
    .reduce(
      (aggr, filter) =>
        Object.assign({}, aggr, {
          [filter[0]]: aggr[filter[0]] ? aggr[filter[0]].concat(filter[1]) : [filter[1]],
        }),
      {}
    );
};

export const toggleQueryParam = (currentQueryParams: string | null, key: string, value: string) => {
  const keyValue = `${key}=${value}`;
  const currentKeyValuePairs = currentQueryParams ? currentQueryParams.split('&') : [];
  const resultArray = currentKeyValuePairs.includes(keyValue)
    ? currentKeyValuePairs.filter((pair) => pair !== keyValue)
    : currentKeyValuePairs.concat(keyValue);
  return resultArray.join('&');
};

export const selectFilters = (): Filter[] => {
  const searchParams = new URLSearchParams(window.location.search);
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
  let filters = selectFilters();
  if (filters.some((item) => matchingFilter(filter, item))) {
    filters = filters.filter((item) => !matchingFilter(filter, item));
  } else {
    filters.push(filter);
  }
  const queryString = filters.map(({ group, tag }) => `${group}=${tag}`).join('&');
  setQueryString(queryString);
};

const setQueryString = (queryString: string): void => {
  const [url] = location.href.split('?');

  window.history.pushState({}, '', [url, queryString].filter(Boolean).join('?'));
  window.dispatchEvent(new CustomEvent('location-changed'));
};
