// Locale modules go under `locales/`, which the service worker caches when they first load
// instead of precaching every locale. See workbox.config.ts.
const LOCALE_MODULE = /[\\/]src[\\/]generated[\\/]locales[\\/]/;

export const chunkFileNames =
  (production: boolean) =>
  ({ facadeModuleId }: { facadeModuleId: string | null }): string => {
    const name = production ? '[name]-[hash].js' : '[name].js';
    return facadeModuleId && LOCALE_MODULE.test(facadeModuleId) ? `locales/${name}` : name;
  };
