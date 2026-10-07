import { site } from 'virtual:hoverboard/site';
import type { Feature } from '../../src/config/features';

// In the build, `__HB_FEATURES__.<name>` is a literal. Tests use a global so they can change it.
const flags = globalThis as unknown as { __HB_FEATURES__: Record<Feature, boolean> };

/** Sets feature flags over the site config. Render or import after calling it. */
export const setFeatures = (features: Partial<Record<Feature, boolean>> = {}): void => {
  flags.__HB_FEATURES__ = { ...site.features, ...features };
};
