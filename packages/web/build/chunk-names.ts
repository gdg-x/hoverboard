// Locale modules go under `locales/`, which the service worker caches when they first load
// instead of precaching every locale. See workbox.config.ts.
const LOCALE_MODULE = /[\\/]src[\\/]generated[\\/]locales[\\/]/;
// Event content translations from vite-plugin-site.ts, `\0virtual:hoverboard/content/<locale>`.
const CONTENT_MODULE = /^\0virtual:hoverboard\/content\/([\w-]+)$/;

export const chunkFileNames =
  (production: boolean) =>
  ({ facadeModuleId }: { facadeModuleId: string | null }): string => {
    const hash = production ? '-[hash]' : '';
    const content = facadeModuleId?.match(CONTENT_MODULE);
    if (content) return `locales/content-${content[1]}${hash}.js`;
    const name = `[name]${hash}.js`;
    return facadeModuleId && LOCALE_MODULE.test(facadeModuleId) ? `locales/${name}` : name;
  };
