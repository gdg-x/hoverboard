import { PolymerElement } from '@polymer/polymer';
import { setFilters } from '../store/filters/actions';
import { TempAny } from '../temp-any';
import { parseFilters } from './filters';

export const getDate = (date: string | Date) => {
  return new Date(date).toLocaleString('{$ dateFormat.locale $}', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const isEmpty = <T>(array: T[]): boolean => {
  return !array || !array.length;
};

export const randomOrder = <T>(array: T[]): T[] => {
  return [...array].sort(() => 0.5 - Math.random());
};

export const generateClassName = (value: string | undefined): string => {
  return value
    ? value
        .replace(/\W+/g, '-')
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .toLowerCase()
    : '';
};

export const getVariableColor = (element: PolymerElement, value: string, fallback?: string) => {
  const ShadyCSS = (window as TempAny).ShadyCSS;
  const calculated = ShadyCSS
    ? ShadyCSS.getComputedStyleValue(element, `--${generateClassName(value)}`)
    : getComputedStyle(element, `--${generateClassName(value)}`);
  return calculated || (fallback && getVariableColor(element, fallback));
};

export const toggleQueryParam = (currentQueryParams: string | null, key: string, value: string) => {
  const keyValue = `${key}=${value}`;
  const currentKeyValuePairs = currentQueryParams ? currentQueryParams.split('&') : [];
  const resultArray = currentKeyValuePairs.includes(keyValue)
    ? currentKeyValuePairs.filter((pair) => pair !== keyValue)
    : currentKeyValuePairs.concat(keyValue);
  return resultArray.join('&');
};

export const setQueryString = (search: string): void => {
  const [url] = location.href.split('?');

  window.history.pushState({}, '', [url, search].filter(Boolean).join('?'));
  setFilters(parseFilters());
};
