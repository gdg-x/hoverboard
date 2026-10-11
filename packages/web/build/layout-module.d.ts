// Types for `virtual:hoverboard/layout`, which vite-plugin-site.ts serves. tsconfig.json maps it here.
import type { SiteConfig } from './resolve-config';

export declare const theme: SiteConfig['theme'];
/** The theme as CSS on `:root`: tokens, density, the pre-refresh variables, badge and tag colors. */
export declare const themeCss: string;
/** The site's `custom.css`, after the theme, or an empty string. */
export declare const customCss: string;
