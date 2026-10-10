export const DEMO_THEME_KEY = 'hb-demo-theme';
export const DEMO_DENSITY_KEY = 'hb-demo-density';
export const DEMO_DECORATIONS_KEY = 'hb-demo-decorations';
export const DEMO_ATTENDANCE_KEY = 'hb-demo-attendance';
export const DEMO_TIME_KEY = 'hb-demo-time';

export const ATTENDANCES = ['inPerson', 'hybrid', 'online'] as const;
export type Attendance = (typeof ATTENDANCES)[number];

export const DEMO_TIMES = ['before', 'during', 'after'] as const;
export type DemoTime = (typeof DEMO_TIMES)[number];

const readChoice = <T extends string>(key: string, values: readonly T[]): T | null => {
  try {
    const value = localStorage.getItem(key);
    return values.find((choice) => choice === value) ?? null;
  } catch {
    return null;
  }
};

/** Stores a choice that changes what much of the site shows, or forgets it with `null`, and reloads. */
const chooseAndReload = (key: string, value: string | null, reload: () => void) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    return;
  }
  reload();
};

/** How people attend, as picked in the demo banner, or `null` for the site's own. */
export const readDemoAttendance = (): Attendance | null =>
  readChoice(DEMO_ATTENDANCE_KEY, ATTENDANCES);

/** Stores how people attend, or forgets it with `null`, and reloads, since the config reads it once. */
export const chooseDemoAttendance = (
  value: Attendance | null,
  reload = () => window.location.reload(),
): void => chooseAndReload(DEMO_ATTENDANCE_KEY, value, reload);

/** When the demo banner says it is, relative to the event, or `null` for the real time. */
export const readDemoTime = (): DemoTime | null => readChoice(DEMO_TIME_KEY, DEMO_TIMES);

/** Stores when it is, or forgets it with `null`, and reloads, since the clock reads it once. */
export const chooseDemoTime = (
  value: DemoTime | null,
  reload = () => window.location.reload(),
): void => chooseAndReload(DEMO_TIME_KEY, value, reload);

export interface DemoChoices {
  theme: string | null;
  density: string | null;
  /** `on` or `off`. */
  decorations: string | null;
}

// The functions below run in the inline page head script too, so they must not use anything from
// outside their own bodies.

/** The theme, spacing and decorations picked in the demo banner, or `null` for the site's own. */
export function readDemoChoices(storage: () => Storage): DemoChoices {
  try {
    return {
      theme: storage().getItem('hb-demo-theme'),
      density: storage().getItem('hb-demo-density'),
      decorations: storage().getItem('hb-demo-decorations'),
    };
  } catch {
    return { theme: null, density: null, decorations: null };
  }
}

/**
 * Sets `data-theme`, `data-density` and `data-decorations` on `<html>`, which the CSS switches on.
 * Without a decorations choice, the site's own `data-decorations` stays.
 */
export function applyDemoChoices(doc: Document, { theme, density, decorations }: DemoChoices) {
  const root = doc.documentElement;
  if (theme) root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  if (density) root.setAttribute('data-density', density);
  else root.removeAttribute('data-density');
  if (decorations === 'off') root.setAttribute('data-decorations', 'off');
  else if (decorations === 'on') root.removeAttribute('data-decorations');
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

/** Turns decorations on or off, and stores the choice when it differs from the site's. */
export const chooseDecorations = (on: boolean, siteOn: boolean): void => {
  try {
    if (on === siteOn) localStorage.removeItem(DEMO_DECORATIONS_KEY);
    else localStorage.setItem(DEMO_DECORATIONS_KEY, on ? 'on' : 'off');
  } catch {
    // Storage can be off. The choice still applies to this page.
  }
  if (on) document.documentElement.removeAttribute('data-decorations');
  else document.documentElement.setAttribute('data-decorations', 'off');
};
