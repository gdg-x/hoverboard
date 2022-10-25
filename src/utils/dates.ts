import { dateFormat } from './data';

export const getDate = (date: string | Date) => {
  return new Date(date).toLocaleString(dateFormat.locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
