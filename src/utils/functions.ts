declare global {
  interface Window {
    ShadyCSS: any;
  }
}

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

export const randomOrder = (array) => {
  return array.sort(() => 0.5 - Math.random());
};

export const generateClassName = (value) => {
  return value
    ? value
        .replace(/\W+/g, '-')
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .toLowerCase()
    : '';
};

// TODO: Remove any
export const getVariableColor = (element: any, value: string, fallback?: string) => {
  const calculated = window.ShadyCSS
    ? window.ShadyCSS.getComputedStyleValue(element, `--${generateClassName(value)}`)
    : getComputedStyle(element, `--${generateClassName(value)}`);
  return calculated || (fallback && getVariableColor(element, fallback));
};

export const parseQueryParamsFilters = (queryParams: string) => {
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
  let resultArray = currentKeyValuePairs.filter((pair) => !pair.startsWith(`${key}=`));
  resultArray = resultArray.concat(keyValue);
  return resultArray.join('&');
};
