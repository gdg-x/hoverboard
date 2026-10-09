/** The pattern of `$defs.link` in the content, resources and site schemas. */
export const SAFE_URL_PATTERN =
  '^(?![\\s\\u0000-\\u001f])(?!.*[\\t\\n\\r])(?:https?://|mailto:|(?![A-Za-z][A-Za-z0-9+.-]*:)(?!//))';

const SAFE_URL = new RegExp(SAFE_URL_PATTERN, 'u');

/**
 * The URL when it is http, https, mailto or a path on the site, and otherwise undefined. Lit does
 * not check URLs, so a `javascript:` link from content would run when clicked.
 */
export const safeUrl = (url: string | null | undefined): string | undefined =>
  url != null && SAFE_URL.test(url) ? url : undefined;
