export const validEmail = (value: string): boolean => {
  // https://stackoverflow.com/a/742588/26406
  const emailRegularExpression = /^[^@\s]+@[^@\s.]+\.[^@.\s]+$/;
  return emailRegularExpression.test(value);
};

export const notEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

export const getSummary = (value = ''): string => {
  const indexes = [value.indexOf('\n'), value.indexOf('<br'), value.length].filter(
    (index) => index > 0,
  );
  return value.slice(0, Math.min(...indexes));
};
