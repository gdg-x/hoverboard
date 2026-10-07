// Every site feature that can be turned off. Gate routes, navigation and home blocks with
// isFeatureEnabled at the boundary, so components never check flags themselves.
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

// Replaced at build time by packages/web/build/vite-plugin-site.ts.
declare const __HB_FEATURES__: Readonly<Record<Feature, boolean>>;

export const isFeature = (value: string): value is Feature =>
  (FEATURES as readonly string[]).includes(value);

export const isFeatureEnabled = (feature: Feature): boolean => __HB_FEATURES__[feature];
