// The only client entry point for site config. Read config from here, never from the data files.

import {
  contentTranslations,
  heroIllustration,
  resources,
  site as settings,
} from 'virtual:hoverboard/site';
import { isFeature, isFeatureEnabled, isNavigationRoute, type NavigationRoute } from './features';
import { deepMerge } from './merge';

export const { basepath, heroSettings, image, organizer, url } = settings;
/** The site's own hero illustration's markup, from `heroSettings.home.illustration`. */
export { heroIllustration };
export const shortName = settings.shortName;
/** `system` lets visitors pick a scheme in the footer. `light` and `dark` lock the site to one. */
export const colorScheme = settings.theme.colorScheme as 'system' | 'light' | 'dark';
/** Section patterns, rotated stickers and illustrations. */
export const decorations = settings.theme.decorations as boolean;
/** The built-in theme and the spacing the site picks. The demo banner starts from them. */
export const themeName = settings.theme.name as string;
export const density = settings.theme.density as 'compact' | 'default' | 'roomy';
export const siteLocales = settings.locales as { source: string; targets: string[] };
export const timeZone = settings.event.timezone;
export const eventDates = { start: settings.event.startDate, end: settings.event.endDate };
export const disabledSchedule = !settings.schedule.published;
export const hashtag = settings.social.hashtag;
export const mailto = settings.organizer.email;
export const socialNetwork = { follow: settings.social.follow };

const mapsKey = (settings.integrations as { googleMapsApiKey?: string } | undefined)
  ?.googleMapsApiKey;
/** The Google Maps script, when the site has a key. The venue block loads it on request. */
export const mapsScriptUrl = mapsKey
  ? `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({
      key: mapsKey,
      libraries: 'maps,marker',
      loading: 'async',
      v: 'beta',
    })}`
  : undefined;

// The build copies content/faq.md and content/coc.md here. A translation can point elsewhere.
const sourceContent = { ...resources, faq: '/data/faq.md', coc: '/data/coc.md' };

// Event content. `loadContent()` reassigns these live bindings, so read them at render time.
export let {
  aboutBlock,
  aboutOrganizerBlock,
  coc,
  description,
  faq,
  featuredVideos,
  footerRelBlock,
  galleryBlock,
  heroDescriptions,
  subscribeBlock,
  team,
  ticketsBlock,
  title,
} = sourceContent;
export let location = { ...settings.event.location, description: resources.mapBlock.description };

let contentRequest = 0;

/** Uses the site's event content translation for `locale`, or the source content without one. */
export const loadContent = async (locale: string): Promise<void> => {
  const request = ++contentRequest;
  const load = contentTranslations[locale];
  const translation = load ? (await load()).default : {};
  if (request !== contentRequest) return;

  const content = deepMerge(sourceContent, translation);
  ({
    aboutBlock,
    aboutOrganizerBlock,
    coc,
    description,
    faq,
    featuredVideos,
    footerRelBlock,
    galleryBlock,
    heroDescriptions,
    subscribeBlock,
    team,
    ticketsBlock,
    title,
  } = content);
  location = { ...settings.event.location, description: content.mapBlock.description };
};

// Skeleton sizes while content loads. The same for every site.
export const contentLoaders = {
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
