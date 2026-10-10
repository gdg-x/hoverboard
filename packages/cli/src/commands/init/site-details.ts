/** How people attend: `event.attendance` in site.json. */
export const ATTENDANCE = ['inPerson', 'online', 'hybrid'] as const;
export type Attendance = (typeof ATTENDANCE)[number];

/** The details `hb init` asks for, and writes to packages/config. */
export interface SiteDetails {
  title: string;
  description: string;
  shortName: string;
  startDate: string;
  endDate: string;
  timezone: string;
  attendance: Attendance;
  /** The link to watch online. Required online, optional for a hybrid event. */
  stream?: string;
  /** The venue, empty for an online event. */
  venue: string;
  address: string;
  city: string;
  shortLocation: string;
  organizerName: string;
  organizerEmail: string;
  /** A custom domain. Without it, the site is at https://<projectId>.web.app/. */
  url?: string;
  /** A built-in theme. Without it, the site keeps its current theme. */
  theme?: string;
  featuresOff: string[];
  /** Only when the map is on. */
  map?: { apiKey: string; latitude: number; longitude: number };
}

type Json = Record<string, unknown>;
type Location = Json & { pointer?: Json; mapCenter?: Json };

export const PROJECT_ID_PATTERN = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;

export const isDate = (value: string): boolean => {
  const date = new Date(value);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().startsWith(value)
  );
};

export const isTimeZone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return value.includes('/') || value === 'UTC';
  } catch {
    return false;
  }
};

export const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const isSiteUrl = (value: string): boolean => /^https?:\/\/.+\/$/.test(value);

export const isStreamUrl = (value: string): boolean => /^https:\/\/\S+$/.test(value);

const isAttendance = (value: unknown): value is Attendance =>
  ATTENDANCE.includes(value as Attendance);

export const defaultUrl = (projectId: string): string => `https://${projectId}.web.app/`;

/** Turns off the features that need a feature that is off, as site.json validation requires. */
export const withDependents = (
  off: Iterable<string>,
  requires: Partial<Record<string, readonly string[]>>,
): string[] => {
  const result = new Set(off);
  for (let added = true; added;) {
    added = false;
    for (const [feature, needs] of Object.entries(requires)) {
      if (!result.has(feature) && needs?.some((need) => result.has(need))) {
        result.add(feature);
        added = true;
      }
    }
  }
  return [...result].sort();
};

interface CurrentConfig {
  site: Json;
  resources: Json;
  /** Every feature with its value after the defaults are merged. */
  features: Record<string, boolean>;
  /** Whether the site moves to another Firebase project, which makes the old project's values wrong. */
  newProject: boolean;
}

/** The current config as answers, so a re-run only changes what the organizer types. */
export const currentDetails = ({
  site,
  resources,
  features,
  newProject,
}: CurrentConfig): SiteDetails => {
  const event = (site['event'] ?? {}) as Json & { location?: Location };
  const location = event.location ?? {};
  const organizer = (site['organizer'] ?? {}) as Json;
  const pointer = location.pointer ?? {};
  const apiKey = ((site['integrations'] ?? {}) as Json)['googleMapsApiKey'];
  const theme = ((site['theme'] ?? {}) as Json)['name'];
  const off = Object.keys(features).filter((feature) => !features[feature]);

  return {
    title: String(resources['title'] ?? ''),
    description: String(resources['description'] ?? ''),
    shortName: String(site['shortName'] ?? ''),
    startDate: String(event['startDate'] ?? ''),
    endDate: String(event['endDate'] ?? ''),
    timezone: String(event['timezone'] ?? Intl.DateTimeFormat().resolvedOptions().timeZone),
    attendance: isAttendance(event['attendance']) ? event['attendance'] : 'inPerson',
    ...(typeof event['stream'] === 'string' ? { stream: event['stream'] } : {}),
    venue: String(location['name'] ?? ''),
    address: String(location['address'] ?? ''),
    city: String(location['city'] ?? ''),
    shortLocation: String(location['short'] ?? ''),
    organizerName: String(organizer['name'] ?? ''),
    organizerEmail: String(organizer['email'] ?? ''),
    ...(!newProject && typeof site['url'] === 'string' ? { url: site['url'] } : {}),
    theme: typeof theme === 'string' ? theme : 'festival',
    // The demo's "Fork me on GitHub" ribbon does not belong on a new site.
    featuresOff: newProject ? [...new Set([...off, 'forkMe'])].sort() : off,
    ...(features['map'] && !newProject && typeof apiKey === 'string'
      ? {
          map: {
            apiKey,
            latitude: Number(pointer['latitude'] ?? 0),
            longitude: Number(pointer['longitude'] ?? 0),
          },
        }
      : {}),
  };
};

interface ApplyOptions {
  projectId: string;
  newProject: boolean;
  features: readonly string[];
  requires: Partial<Record<string, readonly string[]>>;
}

/** The site files with the details applied. Values the wizard does not ask for are kept. */
export const applySiteDetails = (
  site: Json,
  resources: Json,
  details: SiteDetails,
  { projectId, newProject, features, requires }: ApplyOptions,
): { site: Json; resources: Json } => {
  const event = (site['event'] ?? {}) as Json & { location?: Location };
  const { location: oldLocation, attendance: _attendance, stream: _stream, ...eventRest } = event;
  const location = oldLocation ?? {};
  const online = details.attendance === 'online';
  const coordinates = details.map
    ? { latitude: details.map.latitude, longitude: details.map.longitude }
    : {};
  // An online event has no venue to show on a map.
  const off = new Set(
    withDependents(online ? [...details.featuresOff, 'map'] : details.featuresOff, requires),
  );
  const integrations = { ...((site['integrations'] ?? {}) as Json) };
  if (details.map && !off.has('map')) {
    integrations['googleMapsApiKey'] = details.map.apiKey;
  } else {
    delete integrations['googleMapsApiKey'];
  }

  const next: Json = {
    ...site,
    firebase: { ...((site['firebase'] ?? {}) as Json), projectId },
    shortName: details.shortName,
    organizer: {
      // The demo's organizer links belong to the old project.
      ...(newProject ? {} : (site['organizer'] as Json)),
      name: details.organizerName,
      email: details.organizerEmail,
    },
    event: {
      ...eventRest,
      ...(details.attendance && details.attendance !== 'inPerson'
        ? { attendance: details.attendance }
        : {}),
      ...(details.stream ? { stream: details.stream } : {}),
      startDate: details.startDate,
      endDate: details.endDate,
      timezone: details.timezone,
      ...(online
        ? {}
        : {
            location: {
              ...location,
              name: details.venue,
              address: details.address,
              city: details.city,
              short: details.shortLocation,
              pointer: { latitude: 0, longitude: 0, zoom: 5, ...location.pointer, ...coordinates },
              mapCenter: { latitude: 0, longitude: 0, ...location.mapCenter, ...coordinates },
            },
          }),
    },
    ...(newProject
      ? { social: { hashtag: details.shortName.replace(/[#\s]/g, ''), follow: [] } }
      : {}),
    features: Object.fromEntries(features.map((feature) => [feature, !off.has(feature)])),
  };
  if (details.theme) {
    next['theme'] = { ...((site['theme'] ?? {}) as Json), name: details.theme };
  }
  if (details.url && details.url !== defaultUrl(projectId)) {
    next['url'] = details.url;
  } else {
    delete next['url'];
  }
  if (Object.keys(integrations).length) {
    next['integrations'] = integrations;
  } else {
    delete next['integrations'];
  }
  // Other sign-in methods must be turned on in the new project first, so it starts with the default.
  if (newProject) delete next['auth'];

  // Doors on days outside the new dates would fail the build.
  const attendingPage = resources['attendingPage'] as
    (Json & { doors?: { day: string }[] }) | undefined;
  const { doors: oldDoors, ...attendingRest } = attendingPage ?? {};
  const doors = (oldDoors ?? []).filter(
    ({ day }) => day >= details.startDate && day <= details.endDate,
  );

  return {
    site: next,
    resources: {
      ...resources,
      title: details.title,
      description: details.description,
      heroDescriptions: {
        ...((resources['heroDescriptions'] ?? {}) as Json),
        home: details.description,
      },
      ...(attendingPage
        ? { attendingPage: doors.length ? { ...attendingRest, doors } : attendingRest }
        : {}),
    },
  };
};

type Ask = (question: string, defaultValue?: string) => Promise<string>;

const askValid = async (
  ask: Ask,
  question: string,
  defaultValue: string,
  valid: (value: string) => boolean,
  hint: string,
): Promise<string> => {
  for (;;) {
    const answer = await ask(question, defaultValue);
    if (valid(answer)) return answer;
    console.log(`  ${hint}`);
  }
};

const required = (value: string) => value.length > 0;

/** Asks for each detail, with the current config as the defaults. */
export const askSiteDetails = async (
  ask: Ask,
  defaults: SiteDetails,
  projectId: string,
  features: readonly string[],
  themes: readonly string[],
): Promise<SiteDetails> => {
  const text = (question: string, value: string) =>
    askValid(ask, question, value, required, 'Required.');

  const title = await text('Event name:', defaults.title);
  const shortName = await text(
    'Short name, under the home screen icon:',
    defaults.shortName || title,
  );
  const description = await text('One sentence about the event:', defaults.description);
  const startDate = await askValid(
    ask,
    'First day (YYYY-MM-DD):',
    defaults.startDate,
    isDate,
    'Use the form 2027-10-15.',
  );
  const endDate = await askValid(
    ask,
    'Last day (YYYY-MM-DD):',
    defaults.endDate || startDate,
    (value) => isDate(value) && value >= startDate,
    `Use the form 2027-10-15, on or after ${startDate}.`,
  );
  const timezone = await askValid(
    ask,
    'Time zone of the event:',
    defaults.timezone,
    isTimeZone,
    'Use an IANA name such as Europe/Kyiv or America/New_York.',
  );
  const attendance = (await askValid(
    ask,
    `How people attend (${ATTENDANCE.join(', ')}):`,
    defaults.attendance,
    isAttendance,
    `Use ${ATTENDANCE.join(', ')}.`,
  )) as Attendance;
  let stream: string | undefined;
  if (attendance === 'online') {
    stream = await askValid(
      ask,
      'Link to watch the event (https://):',
      defaults.stream ?? '',
      isStreamUrl,
      'Use an https:// link.',
    );
  } else if (attendance === 'hybrid') {
    stream =
      (await askValid(
        ask,
        'Link to watch the event online (https://, leave empty for none):',
        defaults.stream ?? '',
        (value) => !value || isStreamUrl(value),
        'Use an https:// link, or leave it empty.',
      )) || undefined;
  }
  const online = attendance === 'online';
  const venue = online ? '' : await text('Venue name:', defaults.venue);
  const address = online ? '' : await text('Venue address:', defaults.address);
  const city = online ? '' : await text('City:', defaults.city);
  const shortLocation = online
    ? ''
    : await text('Short location, such as "Lviv, Ukraine":', defaults.shortLocation || city);
  const organizerName = await text('Organizer name:', defaults.organizerName);
  const organizerEmail = await askValid(
    ask,
    'Organizer email:',
    defaults.organizerEmail,
    isEmail,
    'Use an email address.',
  );
  const url = await askValid(
    ask,
    'Site URL:',
    defaults.url ?? defaultUrl(projectId),
    isSiteUrl,
    'Use a full URL that ends with a slash, such as https://devfest.example.com/.',
  );
  const theme = await askValid(
    ask,
    `Theme (${themes.join(' or ')}):`,
    defaults.theme && themes.includes(defaults.theme) ? defaults.theme : themes[0]!,
    (value) => themes.includes(value),
    `Use ${themes.join(' or ')}.`,
  );

  console.log(`\nFeatures: ${features.join(', ')}.`);
  const featuresOff = (
    await askValid(
      ask,
      'Features to turn off, separated by commas:',
      defaults.featuresOff.join(', '),
      (value) =>
        value
          .split(',')
          .map((name) => name.trim())
          .every((name) => !name || features.includes(name)),
      'Use names from the list above.',
    )
  )
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  let map: SiteDetails['map'];
  if (online) {
    if (!featuresOff.includes('map')) featuresOff.push('map');
  } else if (!featuresOff.includes('map')) {
    const apiKey = await ask(
      'Google Maps API key for the venue map (leave empty to turn the map off):',
      defaults.map?.apiKey ?? '',
    );
    if (apiKey) {
      const coordinate = (question: string, value: number, limit: number) =>
        askValid(
          ask,
          question,
          String(value),
          (answer) => Math.abs(Number(answer)) <= limit && answer !== '',
          `Use a number from -${limit} to ${limit}.`,
        ).then(Number);
      map = {
        apiKey,
        latitude: await coordinate('Venue latitude:', defaults.map?.latitude ?? 0, 90),
        longitude: await coordinate('Venue longitude:', defaults.map?.longitude ?? 0, 180),
      };
    } else {
      featuresOff.push('map');
    }
  }

  return {
    title,
    description,
    shortName,
    startDate,
    endDate,
    timezone,
    attendance,
    ...(stream ? { stream } : {}),
    venue,
    address,
    city,
    shortLocation,
    organizerName,
    organizerEmail,
    ...(url === defaultUrl(projectId) ? {} : { url }),
    theme,
    featuresOff,
    ...(map ? { map } : {}),
  };
};
