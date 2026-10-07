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

// Every feature stays on until site config can turn features off.
const enabled = Object.fromEntries(FEATURES.map((feature) => [feature, true])) as Readonly<
  Record<Feature, boolean>
>;

export const isFeature = (value: string): value is Feature =>
  (FEATURES as readonly string[]).includes(value);

export const isFeatureEnabled = (feature: Feature): boolean => enabled[feature];
