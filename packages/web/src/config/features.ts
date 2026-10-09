// Every site feature that can be turned off in site.json. Gate routes, navigation and home blocks
// at the boundary, so components never check flags themselves. Read `__HB_FEATURES__.<name>`
// directly where a disabled feature's code should be dropped from the bundle.
export const FEATURES = [
  'blog',
  'codeOfConduct',
  'demo',
  'faq',
  'feedback',
  'forkMe',
  'functions',
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
  // These run in Cloud Functions.
  imageOptimization: ['functions'],
  mailchimp: ['subscribe', 'functions'],
  mySchedule: ['schedule'],
  notifications: ['functions'],
  // Session pages link to speaker pages.
  schedule: ['speakers'],
};

export const isFeature = (value: string): value is Feature =>
  (FEATURES as readonly string[]).includes(value);

export const isFeatureEnabled = (feature: Feature): boolean => __HB_FEATURES__[feature];

/** Routes a `navigation` entry in site.json can use: home and the features that have a page. */
export const NAVIGATION_ROUTES = [
  'home',
  'blog',
  'codeOfConduct',
  'faq',
  'mySchedule',
  'previousSpeakers',
  'schedule',
  'speakers',
  'team',
] as const satisfies readonly ('home' | Feature)[];

export type NavigationRoute = (typeof NAVIGATION_ROUTES)[number];

export const isNavigationRoute = (value: string): value is NavigationRoute =>
  (NAVIGATION_ROUTES as readonly string[]).includes(value);
