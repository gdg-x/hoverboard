// Types for `virtual:hoverboard/site`, which vite-plugin-site.ts serves. tsconfig.json maps it here.
import type { SiteConfig } from './resolve-config';

export declare const site: SiteConfig['site'];
export declare const resources: SiteConfig['resources'];
// Each translation holds only the translated keys, at any depth, so it is typed loosely.
export declare const contentTranslations: Record<string, () => Promise<{ default: object }>>;
