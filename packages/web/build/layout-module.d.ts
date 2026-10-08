// Types for `virtual:hoverboard/layout`, which vite-plugin-site.ts serves. tsconfig.json maps it here.
import type { SiteConfig } from './resolve-config';

export declare const theme: SiteConfig['theme'];
/** The theme tokens and the badge and tag colors as CSS variables on `:root`. */
export declare const themeCss: string;
/** The Google Maps script, when the map is on and the site has a key. */
export declare const mapsScript: string | undefined;
