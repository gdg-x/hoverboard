// The only client entry point for site config. Read config from here, never from the data files.

import { contentTranslations, resources, site as settings } from 'virtual:hoverboard/site';
import { isFeature, isFeatureEnabled, isNavigationRoute, type NavigationRoute } from './features';
import { deepMerge } from './merge';

export const { coc, faq } = resources;
export const { basepath, heroSettings, image, organizer, url } = settings;
export const siteLocales = settings.locales as { source: string; targets: string[] };
export const timeZone = settings.event.timezone;
export const disabledSchedule = !settings.schedule.published;
export const hashtag = settings.social.hashtag;
export const mailto = settings.organizer.email;
export const socialNetwork = { follow: settings.social.follow };

// Event content. `loadContent()` reassigns these live bindings, so read them at render time.
export let {
  aboutBlock,
  aboutOrganizerBlock,
  dates,
  description,
  featuredVideos,
  footerRelBlock,
  galleryBlock,
  subscribeBlock,
  team,
  ticketsBlock,
  title,
} = resources;
export let location = { ...settings.event.location, description: resources.mapBlock.description };

let contentRequest = 0;

/** Uses the site's event content translation for `locale`, or the source content without one. */
export const loadContent = async (locale: string): Promise<void> => {
  const request = ++contentRequest;
  const load = contentTranslations[locale];
  const translation = load ? (await load()).default : {};
  if (request !== contentRequest) return;

  const content = deepMerge(resources, translation);
  ({
    aboutBlock,
    aboutOrganizerBlock,
    dates,
    description,
    featuredVideos,
    footerRelBlock,
    galleryBlock,
    subscribeBlock,
    team,
    ticketsBlock,
    title,
  } = content);
  location = { ...settings.event.location, description: content.mapBlock.description };
};

// Skeleton sizes while content loads. The same for every site.
export const contentLoaders = {
  schedule: { itemsCount: 2 },
  blog: { itemsCount: 3 },
  speakers: { itemsCount: 4 },
  previousSpeakers: { itemsCount: 6 },
  tickets: { itemsCount: 5 },
};

const PROVIDERS = {
  google: { label: 'Google', url: 'https://accounts.google.com' },
  facebook: { label: 'Facebook', url: 'https://www.facebook.com' },
  twitter: { label: 'Twitter', url: 'https://twitter.com' },
};
type Provider = keyof typeof PROVIDERS;

export const signInProviders = {
  // The build validates the names against site.schema.json.
  providersData: (settings.auth.providers as Provider[]).map((name) => ({
    name,
    label: PROVIDERS[name].label,
    url: PROVIDERS[name].url,
  })),
  allowedProvidersUrl: Object.values(PROVIDERS).map(({ url }) => url),
};

// Entries whose route names a feature are hidden when that feature is off. The build checks the routes.
export const navigation = settings.navigation.filter(
  (entry): entry is typeof entry & { route: NavigationRoute } =>
    isNavigationRoute(entry.route) && (!isFeature(entry.route) || isFeatureEnabled(entry.route)),
);
