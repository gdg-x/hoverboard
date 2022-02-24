import { PolymerElement } from '@polymer/polymer';
import { TempAny } from '../temp-any';
import { dateFormat } from './data';

export const getDate = (date: string | Date) => {
  return new Date(date).toLocaleString(dateFormat.locale, {
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

export const getVariableColor = (
  element: PolymerElement,
  value: string,
  fallback?: string
): string => {
  const ShadyCSS = (window as TempAny).ShadyCSS;
  const calculated = ShadyCSS
    ? ShadyCSS.getComputedStyleValue(element, `--${generateClassName(value)}`)
    : getComputedStyle(element, `--${generateClassName(value)}`);
  return calculated || (fallback && getVariableColor(element, fallback));
};
