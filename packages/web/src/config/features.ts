// Every site feature that can be turned off in site.json. Gate routes, navigation and home blocks
// at the boundary, so components never check flags themselves. Read `__HB_FEATURES__.<name>`
// directly where a disabled feature's code should be dropped from the bundle.
export const FEATURES = [
  'blog',
  'codeOfConduct',
  'faq',
  'feedback',
  'forkMe',
  'gallery',
  'imageOptimization',
  'mailchimp',
  'map',
  'mySchedule',
  'notifications',
  'partners',
  'previousSpeakers',
  'schedule',
  'speakers',
  'subscribe',
  'team',
  'tickets',
  'videos',
] as const;

export type Feature = (typeof FEATURES)[number];

declare global {
  /** The `features` from site.json. The build replaces every `__HB_FEATURES__.<name>` with a literal. */
  const __HB_FEATURES__: Readonly<Record<Feature, boolean>>;
}

/** Features that only work when other features are on. The build fails otherwise. */
export const FEATURE_REQUIRES: Partial<Record<Feature, readonly Feature[]>> = {
  feedback: ['schedule'],
  mailchimp: ['subscribe'],
  mySchedule: ['schedule'],
  // Session pages link to speaker pages, and one generator writes both.
  schedule: ['speakers'],
};

export const isFeature = (value: string): value is Feature =>
  (FEATURES as readonly string[]).includes(value);

export const isFeatureEnabled = (feature: Feature): boolean => __HB_FEATURES__[feature];
