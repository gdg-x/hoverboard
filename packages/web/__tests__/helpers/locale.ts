import { getLocale, locales, setLocale } from '../../src/utils/localization';

/**
 * Switches to `locale` and resolves on Lit Localize's `ready` event for it, when components have
 * been asked to re-render. Await an element's `updateComplete` before checking its text.
 */
export const useLocale = async (locale: string): Promise<void> => {
  if (!locales.includes(locale)) {
    throw new Error(`The site does not offer ${locale}. It offers ${locales.join(', ')}.`);
  }
  if (getLocale() === locale) return;

  const ready = new Promise<void>((resolve) => {
    const onStatus = (event: WindowEventMap['lit-localize-status']) => {
      if (event.detail.status !== 'ready' || event.detail.readyLocale !== locale) return;
      window.removeEventListener('lit-localize-status', onStatus);
      resolve();
    };
    window.addEventListener('lit-localize-status', onStatus);
  });
  await setLocale(locale);
  await ready;
};
