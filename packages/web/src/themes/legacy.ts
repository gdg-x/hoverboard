/**
 * The CSS variables of the pre-refresh theme, mapped to the new tokens, so components keep working
 * until each one moves to `--hb-*` variables. Remove it in the cleanup step of the visual refresh.
 */
export const LEGACY_VARIABLES: Readonly<Record<string, string>> = {
  '--default-primary-color': 'var(--hb-color-primary)',
  '--dark-primary-color': 'color-mix(in srgb, var(--hb-color-primary) 80%, black)',
  '--focused-color': 'var(--hb-color-focus)',
  '--accent-color': 'var(--hb-color-accent-2)',
  '--text-primary-color': 'var(--hb-color-on-primary)',
  '--primary-background-color': 'var(--hb-color-surface)',
  '--default-background-color': 'var(--hb-color-surface-bright)',
  '--secondary-background-color': 'var(--hb-color-surface-container)',
  '--additional-background-color': 'var(--hb-color-surface-container)',
  '--contrast-additional-background-color': 'var(--hb-color-surface-container-high)',
  '--primary-text-color': 'var(--hb-color-on-surface)',
  '--secondary-text-color': 'var(--hb-color-on-surface-variant)',
  '--disabled-text-color': 'color-mix(in srgb, var(--hb-color-on-surface) 38%, transparent)',
  '--divider-color': 'var(--hb-color-outline-variant)',
  '--border-light-color': 'var(--hb-color-outline-variant)',
  '--footer-background-color': 'var(--hb-color-surface-container)',
  '--footer-text-color': 'var(--hb-color-on-surface-variant)',
  '--error-color': 'var(--hb-color-error)',
  '--snackbar-background-color': 'var(--hb-color-on-surface)',
  '--snackbar-text-color': 'var(--hb-color-surface)',
  '--star-rating-color': 'var(--hb-color-accent-3)',
  '--twitter-color': 'var(--hb-color-primary)',
  '--facebook-color': 'var(--hb-color-primary)',
};
