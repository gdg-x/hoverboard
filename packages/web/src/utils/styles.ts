export interface ShadyCSSGlobal {
  getComputedStyleValue(element: Element, property: string): string;
}

export const generateClassName = (value: string | undefined): string => {
  return value
    ? value
        .replace(/\W+/g, '-')
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .toLowerCase()
    : '';
};

export const getVariableColor = (
  element: Element,
  value: string,
  fallback?: string,
): string | undefined => {
  const ShadyCSS = (window as { ShadyCSS?: ShadyCSSGlobal }).ShadyCSS;
  const name = `--${generateClassName(value)}`;
  const calculated = (
    ShadyCSS
      ? ShadyCSS.getComputedStyleValue(element, name)
      : getComputedStyle(element).getPropertyValue(name)
  ).trim();
  return calculated || (fallback ? getVariableColor(element, fallback) : undefined);
};
