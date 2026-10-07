import { readFileSync } from 'fs';
import * as logger from 'firebase-functions/logger';

/** The site features that functions depend on. */
export type FunctionFeature =
  'imageOptimization' | 'mailchimp' | 'mySchedule' | 'notifications' | 'schedule' | 'speakers';

type Features = Partial<Record<FunctionFeature, boolean>>;

let features: Features | undefined;

const loadFeatures = (): Features => {
  try {
    // scripts/write-features.mjs writes dist/features.json, next to dist/src/.
    return JSON.parse(readFileSync(new URL('../features.json', import.meta.url), 'utf8'));
  } catch {
    logger.warn('features.json is missing, so every feature is on. Run `npm run build`.');
    return {};
  }
};

/**
 * Every function always deploys. When none of `anyOf` is on, this logs an error that names the
 * `site.json` keys and returns true, and the function returns without doing any work.
 */
export const isFeatureOff = (functionName: string, ...anyOf: FunctionFeature[]): boolean => {
  features ??= loadFeatures();
  if (anyOf.some((feature) => features?.[feature] !== false)) return false;

  const keys = anyOf.map((feature) => `features.${feature}`).join(' and ');
  logger.error(
    `${functionName} did nothing because ${keys} ${anyOf.length === 1 ? 'is' : 'are'} false in packages/config/site.json.`,
  );
  return true;
};
