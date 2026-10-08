export const generateClassName = (value: string | undefined): string => {
  return value
    ? value
        .replace(/\W+/g, '-')
        .replace(/([a-z\d])([A-Z])/g, '$1-$2')
        .toLowerCase()
    : '';
};

/**
 * A reference to the color variable of a tag or badge, such as `var(--android)`. The browser
 * resolves it, so it renders the same on the server, which has no computed styles.
 */
export const variableColor = (value: string, fallback?: string): string => {
  const name = `--${generateClassName(value)}`;
  return fallback ? `var(${name}, var(--${generateClassName(fallback)}))` : `var(${name})`;
};
