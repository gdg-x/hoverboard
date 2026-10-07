// The only client entry point for site config. Read config from here, never from the data files.

import siteResources from '../../../config/content/resources.json';
import siteSettings from '../../../config/site.json';
import defaultResources from '../../defaults/content/resources.json';
import defaultSettings from '../../defaults/site.json';
import { isFeature, isFeatureEnabled } from './features';
import { deepMerge } from './merge';

// Same order as packages/web/build/resolve-config.ts: upstream defaults, then the site.
const resources = deepMerge(defaultResources, siteResources);
const settings = deepMerge(defaultSettings, siteSettings);

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
  image,
  viewHighlights,
} = resources;
export const {
  contentLoaders,
  dateFormat,
  disabledSchedule,
  hashtag,
  heroSettings,
  location,
  mailto,
  organizer,
  showForkMeBlockForProjectIds,
  signInProviders,
  socialNetwork,
} = settings;

// Entries whose route names a feature are hidden when that feature is off.
export const navigation = settings.navigation.filter(
  ({ route }) => !isFeature(route) || isFeatureEnabled(route),
);

// Deploy-specific values are rendered into meta tags in index.html at build time.
export enum CONFIG {
  BASEPATH = 'basepath',
  URL = 'url',
  GOOGLE_MAPS_API_KEY = 'google-maps-api-key',
}

export const getConfig = (key: CONFIG): string => {
  const element = document.querySelector<HTMLMetaElement>(`meta[name="config-${key}"]`);

  if (element === null || !element.content) {
    throw new Error(`Config ${key} is missing or doesn't have a value`);
  }

  return element.content;
};
