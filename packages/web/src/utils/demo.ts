export const DEMO_THEME_KEY = 'hb-demo-theme';
export const DEMO_DENSITY_KEY = 'hb-demo-density';

export interface DemoChoices {
  theme: string | null;
  density: string | null;
}

// The functions below run in the inline page head script too, so they must not use anything from
// outside their own bodies.

/** The theme and spacing picked in the demo banner, or `null` for the site's own. */
export function readDemoChoices(storage: () => Storage): DemoChoices {
  try {
    return {
      theme: storage().getItem('hb-demo-theme'),
      density: storage().getItem('hb-demo-density'),
    };
  } catch {
    return { theme: null, density: null };
  }
}

/** Sets `data-theme` and `data-density` on `<html>`, which the theme CSS switches on. */
export function applyDemoChoices(doc: Document, { theme, density }: DemoChoices) {
  const root = doc.documentElement;
  if (theme) root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  if (density) root.setAttribute('data-density', density);
  else root.removeAttribute('data-density');
}

/**
 * The inline script at the top of the page head when the demo banner is on: it applies the stored
 * choices before the first paint, and again to each page the client router swaps in.
 */
export const demoScript = `(() => {
${readDemoChoices.toString()}
${applyDemoChoices.toString()}
const storage = () => localStorage;
applyDemoChoices(document, readDemoChoices(storage));
document.addEventListener('astro:before-swap', (event) =>
  applyDemoChoices(event.newDocument, readDemoChoices(storage)),
);
})();`;

/** Stores a choice from the demo banner, or clears it with `null`, and applies it to the page. */
export const chooseDemo = (key: 'theme' | 'density', value: string | null): void => {
  const storageKey = key === 'theme' ? DEMO_THEME_KEY : DEMO_DENSITY_KEY;
  try {
    if (value) localStorage.setItem(storageKey, value);
    else localStorage.removeItem(storageKey);
  } catch {
    // Storage can be off. The choice still applies to this page.
  }
  const root = document.documentElement;
  if (value) root.setAttribute(`data-${key}`, value);
  else root.removeAttribute(`data-${key}`);
};
