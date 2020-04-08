import 'core-js/features/array/flat-map';

export const allKeys = <T>(values: T[]) => {
  const keys = values.flatMap((value) => Object.keys(value));

  return [...new Set(keys)].sort();
};
