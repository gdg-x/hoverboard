export const allKeys = <T extends object>(values: T[]) => {
  const keys = values.flatMap((value) => Object.keys(value));

  return [...new Set(keys)].sort();
};
