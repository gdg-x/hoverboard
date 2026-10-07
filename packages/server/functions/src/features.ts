import * as logger from 'firebase-functions/logger';
import { getSiteConfig } from './site-config.js';

/** The site features that functions depend on. */
export type FunctionFeature =
  'imageOptimization' | 'mailchimp' | 'mySchedule' | 'notifications' | 'schedule' | 'speakers';

/**
 * Every function always deploys. When none of `anyOf` is on, this logs an error that names the
 * `site.json` keys and returns true, and the function returns without doing any work.
 */
export const isFeatureOff = (functionName: string, ...anyOf: FunctionFeature[]): boolean => {
  const { features } = getSiteConfig();
  if (anyOf.some((feature) => features[feature] !== false)) return false;

  const keys = anyOf.map((feature) => `features.${feature}`).join(' and ');
  logger.error(
    `${functionName} did nothing because ${keys} ${anyOf.length === 1 ? 'is' : 'are'} false in packages/config/site.json.`,
  );
  return true;
};
