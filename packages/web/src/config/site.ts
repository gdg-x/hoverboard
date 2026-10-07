// The only client entry point for site config. Read config from here, never from the data files.

import { resources, site as settings } from 'virtual:hoverboard/site';
import { isFeature, isFeatureEnabled } from './features';

export const {
  aboutBlock,
  aboutOrganizerBlock,
  addToHomeScreen,
  blog,
  bookmarked,
  buyTicket,
  coc,
  codeOfConduct,
  dates,
  description,
  emailUs,
  faq,
  featuredVideos,
  feedback,
  filters,
  followOur,
  followUs,
  footer,
  footerRelBlock,
  galleryBlock,
  latestPostsBlock,
  loading,
  mapBlock,
  mySchedule,
  notifications,
  offlineMessage,
  partnersBlock,
  previousSpeakersBlock,
  refresh,
  schedule,
  serviceWorkerAvailable,
  serviceWorkerError,
  serviceWorkerInstalled,
  serviceWorkerInstalling,
  sessionDetails,
  signIn,
  signInDialog,
  signOut,
  speakerDetails,
  speakers,
  speakersBlock,
  subscribeBlock,
  subscribeNote,
  team,
  ticketsBlock,
  timezoneOffset,
  title,
  viewHighlights,
} = resources;
export const {
  basepath,
  dateFormat,
  heroSettings,
  image,
  organizer,
  showForkMeBlockForProjectIds,
  url,
} = settings;
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
    label: `Sign in with ${PROVIDERS[name].label}`,
    url: PROVIDERS[name].url,
  })),
  allowedProvidersUrl: Object.values(PROVIDERS).map(({ url }) => url),
};

// Entries whose route names a feature are hidden when that feature is off.
export const navigation = settings.navigation.filter(
  ({ route }) => !isFeature(route) || isFeatureEnabled(route),
);
