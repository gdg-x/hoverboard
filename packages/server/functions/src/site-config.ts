import { readFileSync } from 'fs';
import * as logger from 'firebase-functions/logger';
import type { FunctionFeature } from './features.js';

export interface SiteConfig {
  features: Partial<Record<FunctionFeature, boolean>>;
  /** The IANA time zone of the event, from `event.timezone`. */
  timeZone: string;
}

let siteConfig: SiteConfig | undefined;

const loadSiteConfig = (): SiteConfig => {
  try {
    // scripts/write-site-config.mjs writes dist/site-config.json, next to dist/src/.
    return JSON.parse(readFileSync(new URL('../site-config.json', import.meta.url), 'utf8'));
  } catch {
    logger.warn(
      'site-config.json is missing, so every feature is on and times are in UTC. Run `npm run build`.',
    );
    return { features: {}, timeZone: 'UTC' };
  }
};

/** The `site.json` values that functions use, copied at build time. */
export const getSiteConfig = (): SiteConfig => (siteConfig ??= loadSiteConfig());
