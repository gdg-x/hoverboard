export const COLOR_SCHEME_KEY = 'hb-color-scheme';

export type ChosenColorScheme = 'light' | 'dark';

// The functions below run in the inline page head script too, so they must not use anything from
// outside their own bodies.

/** The visitor's choice from the footer toggle, or `null` to follow the browser. */
export function readColorScheme(storage: () => Storage): ChosenColorScheme | null {
  try {
    const value = storage().getItem('hb-color-scheme');
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Locks the page to `scheme`, or lets it follow the browser with `null`. The `theme-color` meta
 * tags carry both colors in `data-light` and `data-dark`.
 */
export function applyColorScheme(doc: Document, scheme: ChosenColorScheme | null) {
  if (scheme) {
    doc.documentElement.setAttribute('data-color-scheme', scheme);
  } else {
    doc.documentElement.removeAttribute('data-color-scheme');
  }
  for (const meta of doc.querySelectorAll('meta[name="theme-color"]')) {
    const own = meta.getAttribute('media')?.includes('dark') ? 'dark' : 'light';
    const color = meta.getAttribute(`data-${scheme ?? own}`);
    if (color) meta.setAttribute('content', color);
  }
}

/**
 * The inline script at the top of the page head: it applies the stored choice before the first
 * paint, and again to each page the client router swaps in, because that replaces `<html>`'s
 * attributes.
 */
export const colorSchemeScript = `(() => {
${readColorScheme.toString()}
${applyColorScheme.toString()}
const storage = () => localStorage;
applyColorScheme(document, readColorScheme(storage));
document.addEventListener('astro:before-swap', (event) =>
  applyColorScheme(event.newDocument, readColorScheme(storage)),
);
})();`;
