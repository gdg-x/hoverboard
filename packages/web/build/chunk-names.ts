// Locale modules go under `locales/`, which the service worker caches when they first load
// instead of precaching every locale. See workbox.config.ts.
const LOCALE_MODULE = /[\\/]src[\\/]generated[\\/]locales[\\/]/;
// Event content translations from vite-plugin-site.ts, `\0virtual:hoverboard/content/<locale>`.
const CONTENT_MODULE = /^\0virtual:hoverboard\/content\/([\w-]+)$/;

// Astro's own name for the other client chunks.
const ASSETS = '_astro';

export const chunkFileNames = ({ facadeModuleId }: { facadeModuleId: string | null }): string => {
  const content = facadeModuleId?.match(CONTENT_MODULE);
  if (content) return `locales/content-${content[1]}-[hash].js`;
  return facadeModuleId && LOCALE_MODULE.test(facadeModuleId)
    ? 'locales/[name]-[hash].js'
    : `${ASSETS}/[name].[hash].js`;
};
