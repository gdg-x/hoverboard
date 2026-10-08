import { getLocale } from './localization';

export const getDate = (date: string | Date) => {
  return new Date(date).toLocaleString(getLocale(), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
