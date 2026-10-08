// The only client entry point for site config. Read config from here, never from the data files.

import { resources, site as settings } from 'virtual:hoverboard/site';
import { isFeature, isFeatureEnabled, isNavigationRoute, type NavigationRoute } from './features';

export const {
  aboutBlock,
  aboutOrganizerBlock,
  blog,
  buyTicket,
  coc,
  dates,
  description,
  faq,
  featuredVideos,
  feedback,
  filters,
  footerRelBlock,
  galleryBlock,
  latestPostsBlock,
  loading,
  mapBlock,
  mySchedule,
  partnersBlock,
  previousSpeakersBlock,
  schedule,
  sessionDetails,
  speakerDetails,
  speakers,
  speakersBlock,
  subscribeBlock,
  team,
  ticketsBlock,
  title,
  viewHighlights,
} = resources;
export const { basepath, dateFormat, heroSettings, image, organizer, url } = settings;
export const timeZone = settings.event.timezone;
export const disabledSchedule = !settings.schedule.published;
export const hashtag = settings.social.hashtag;
export const mailto = settings.organizer.email;
export const socialNetwork = { follow: settings.social.follow };
export const location = {
  ...settings.event.location,
  description: resources.mapBlock.description,
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
