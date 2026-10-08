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

/** A tag's color from `theme.tagColors`, or the outline color for tags without one. */
export const tagColor = (tag: string): string =>
  `var(--hb-tag-${generateClassName(tag)}, var(--hb-color-outline))`;

/**
 * The `view-transition-name` of a person's photo, the same on their card and their page, so the
 * photo moves from one to the other.
 */
export const photoTransitionName = (kind: 'speaker' | 'previous-speaker', id: string): string =>
  `${kind}-${id.replace(/[^\w-]/g, '-')}`;

/** `hb-chip` colors for a tag: the container and text colors the build derives from its color. */
export const tagChipStyle = (tag: string): Record<string, string> => {
  const name = generateClassName(tag);
  return {
    '--hb-chip-background': `var(--hb-tag-${name}-container, var(--hb-color-surface-container))`,
    '--hb-chip-color': `var(--hb-on-tag-${name}-container, var(--hb-color-on-surface))`,
    '--hb-chip-border-color': 'transparent',
  };
};
