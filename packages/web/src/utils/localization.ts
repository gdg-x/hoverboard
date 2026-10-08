/// <reference types="vite/client" />
import { configureLocalization, type LocaleModule } from '@lit/localize';

// Matches `sourceLocale` in lit-localize.json.
export const sourceLocale = 'en';

const STORAGE_KEY = 'hoverboard-locale';

const modules = import.meta.glob<LocaleModule>('../generated/locales/*.ts');
const moduleFor = (locale: string) => `../generated/locales/${locale}.ts`;

// Listed from the built modules, because locale-codes.ts writes an empty `targetLocales` as `[ , ]`.
export const targetLocales = Object.keys(modules).map((path) => path.replace(/^.*\/|\.ts$/g, ''));

/** Every locale the site offers, the source locale first. */
export const locales = [sourceLocale, ...targetLocales];

const { getLocale, setLocale: loadLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: (locale) => modules[moduleFor(locale)]!(),
});

export { getLocale };

/**
 * The first of the stored choice and the browser's languages that is available, matching
 * `en-US` to `en` when there is no exact match. Falls back to the source locale.
 */
export const pickLocale = (
  available: readonly string[],
  stored: string | null,
  preferred: readonly string[],
): string => {
  const find = (code: string) =>
    available.find((locale) => locale.toLowerCase() === code.toLowerCase());
  for (const candidate of [stored, ...preferred]) {
    if (!candidate) continue;
    const match = find(candidate) ?? find(candidate.split('-')[0]!);
    if (match) return match;
  }
  return sourceLocale;
};

const readStoredLocale = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const applyLocale = async (locale: string) => {
  await loadLocale(locale);
  document.documentElement.lang = locale;
};

/** Switches to the stored or browser locale when the site offers it. Call once at startup. */
export const startLocalization = async (): Promise<void> => {
  const locale = pickLocale(locales, readStoredLocale(), navigator.languages);
  if (locale !== getLocale()) await applyLocale(locale);
};

/** Switches locale and remembers the choice. Ignores locales the site does not offer. */
export const setLocale = async (locale: string): Promise<void> => {
  if (!locales.includes(locale)) return;
  await applyLocale(locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable, for example in private browsing. The choice lasts for this visit.
  }
};
