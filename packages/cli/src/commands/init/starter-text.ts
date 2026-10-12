import type { SiteDetails } from './site-details.js';

type Json = Record<string, unknown>;
type Ask = (question: string, defaultValue?: string) => Promise<string>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** `override` over `base`, the way site.json overrides the defaults: objects merge, the rest replaces. */
export const mergeText = (base: Json, override: Json): Json =>
  Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(override)])].map((key) => {
      const [from, to] = [base[key], override[key]];
      if (!(key in override)) return [key, from];
      return [key, isObject(from) && isObject(to) ? mergeText(from, to) : to];
    }),
  );

const days = ({ startDate, endDate }: SiteDetails) =>
  Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000) + 1;

/**
 * Neutral text for a new site, in place of the demo's, which describes GDG DevFest Ukraine. Keeps
 * the demo's structure, so the site looks complete, and its images, videos and photo links, which
 * the organizer replaces later. Leaves out the demo's highlights video, which the home page offers.
 */
export const starterResources = (
  resources: Json,
  details: SiteDetails,
  features: Record<string, boolean>,
): Json => {
  const { title, shortName, organizerName, organizerEmail } = details;
  const on = (feature: string) => features[feature] !== false;
  const online = details.attendance === 'online';
  const where = online ? 'online' : details.city;
  const about = (resources['aboutBlock'] ?? {}) as Json & {
    callToAction?: Json & { howItWas?: Json };
    statisticsBlock?: Json & { days?: Json };
  };
  const attending = resources['attendingPage'] as Json | undefined;
  const contact = {
    name: `Contact ${organizerName}`,
    url: `mailto:${organizerEmail}`,
    newTab: false,
  };
  const pages = [
    ...(on('attending')
      ? [{ name: online ? 'How to join' : 'Getting there', url: '/attending' }]
      : []),
    ...(on('faq') ? [{ name: 'FAQ', url: '/faq' }] : []),
    ...(on('codeOfConduct') ? [{ name: 'Code of conduct', url: '/coc' }] : []),
  ].map((link) => ({ ...link, newTab: false }));

  return {
    ...resources,
    keywords: [shortName, 'conference', where].filter(Boolean).join(', '),
    heroDescriptions: {
      home: details.description,
      ...(on('attending')
        ? {
            attending: online
              ? `Everything you need to join ${title} online.`
              : `Everything you need to get to ${title}.`,
          }
        : {}),
      ...(on('speakers') ? { speakers: `Meet the speakers of ${title}.` } : {}),
    },
    aboutBlock: {
      ...about,
      // Without the demo's highlights video, which is of another event. Organizers add their own.
      callToAction: {
        ...Object.fromEntries(
          Object.entries(about.callToAction ?? {}).filter(([key]) => key !== 'howItWas'),
        ),
        featuredSessions: {
          description: `${title} brings people together for talks, workshops and conversations.`,
          label: on('schedule') ? 'See the schedule' : 'Meet the speakers',
          link: on('schedule') ? '/schedule' : on('speakers') ? '/speakers' : '/',
        },
      },
      statisticsBlock: {
        ...about.statisticsBlock,
        days: { ...about.statisticsBlock?.days, label: 'Days', number: String(days(details)) },
      },
    },
    aboutOrganizerBlock: {
      ...(resources['aboutOrganizerBlock'] as Json),
      blocks: [
        {
          title: 'Organizer',
          description: `${organizerName} organizes ${title}.`,
          callToAction: on('team')
            ? { label: 'Meet the team', link: '/team' }
            : { label: 'Contact us', link: `mailto:${organizerEmail}` },
        },
      ],
    },
    team: { description: `The people who make ${title} happen.` },
    ticketsBlock: {
      ticketsDetails: `A ticket gives access to every session of ${title}.`,
    },
    featuredVideos: { ...(resources['featuredVideos'] as Json), title: 'Featured videos' },
    galleryBlock: {
      ...(resources['galleryBlock'] as Json),
      title: 'Highlights',
      description: `Photos from earlier editions of ${shortName}.`,
    },
    subscribeBlock: { formTitle: `Get the latest news about ${title} in your inbox.` },
    codeOfConductBlock: {
      form: `mailto:${organizerEmail}`,
      contacts: [`${organizerName}, ${organizerEmail}`],
    },
    footerRelBlock: [{ title: shortName, links: [...pages, contact] }],
    mapBlock: { description: online ? title : `${details.venue}, ${details.address}.` },
    // Directions, hotels and the venue's Wi-Fi were the demo's.
    ...(attending
      ? {
          attendingPage: {
            description: online
              ? `How to join ${title} online.`
              : `How to get to ${title} in ${details.city}, and what to expect at the venue.`,
            ...(typeof attending['online'] === 'string' ? { online: attending['online'] } : {}),
          },
        }
      : {}),
  };
};

/** Asks for the hero texts of the pages that are on, and the ticket text, with `resources` as the defaults. */
export const askStarterText = async (
  ask: Ask,
  resources: Json,
  features: Record<string, boolean>,
): Promise<Json> => {
  const on = (feature: string) => features[feature] !== false;
  const hero = { ...((resources['heroDescriptions'] ?? {}) as Record<string, string>) };
  const pages: [key: string, feature: string, page: string][] = [
    ['attending', 'attending', 'attending'],
    ['speakers', 'speakers', 'speakers'],
    ['schedule', 'schedule', 'schedule'],
    ['team', 'team', 'team'],
    ['blog', 'blog', 'blog'],
    ['faq', 'faq', 'FAQ'],
  ];
  console.log('\nThe text under the title of each page. Leave one empty to keep the default.');
  for (const [key, feature, page] of pages) {
    if (!on(feature)) continue;
    const answer = await ask(`Text on the ${page} page:`, hero[key] ?? '');
    if (answer) hero[key] = answer;
  }
  const tickets = (resources['ticketsBlock'] ?? {}) as Json;
  const currentDetails = tickets['ticketsDetails'];
  const ticketsDetails = on('tickets')
    ? await ask('What a ticket includes:', typeof currentDetails === 'string' ? currentDetails : '')
    : '';
  return {
    ...resources,
    heroDescriptions: hero,
    ...(ticketsDetails ? { ticketsBlock: { ...tickets, ticketsDetails } } : {}),
  };
};
