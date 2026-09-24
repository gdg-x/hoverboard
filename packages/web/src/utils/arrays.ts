export const isEmpty = <T>(array: T[]): boolean => {
  return !array || !array.length;
};

export const randomOrder = <T>(array: T[]): T[] => {
  return [...array].sort(() => 0.5 - Math.random());
};
