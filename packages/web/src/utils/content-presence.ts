import { type Feature, isFeature, isFeatureEnabled } from '../config/features';

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

// Pages whose path isn't their feature's name.
const PAGE_FEATURES: Record<string, Feature> = {
  coc: 'codeOfConduct',
  'previous-speakers': 'previousSpeakers',
  sessions: 'schedule',
};

/**
 * Whether a link leads somewhere: off the site, or to a page whose feature is on and has content.
 * Content such as `aboutOrganizerBlock` can link to `/team` before the team is out.
 */
export const linkLeadsSomewhere = (presence: ContentPresence, link: string): boolean => {
  if (!link.startsWith('/') || link.startsWith('//')) return true;
  const [, part = ''] = link.split(/[/?#]/);
  const feature = PAGE_FEATURES[part] ?? part;
  return !isFeature(feature) || (isFeatureEnabled(feature) && hasContent(presence, feature));
};
