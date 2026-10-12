import type { Feature } from '../config/features';

/**
 * Whether the build found content for each feature that shows content, such as `speakers`. The
 * site hides the navigation links and home blocks of features without it.
 */
export type ContentPresence = Partial<Record<Feature, boolean>>;

/**
 * Whether the feature, or the navigation route, has content. Only an explicit `false` hides it, so
 * a component given no presence shows everything.
 */
export const hasContent = (presence: ContentPresence, route: Feature | 'home'): boolean =>
  presence[route === 'mySchedule' ? 'schedule' : (route as Feature)] !== false;
