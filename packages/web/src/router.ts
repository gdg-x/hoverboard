type Params = Record<string, string | undefined>;

export interface RouteLocation {
  pathname: string;
  search: string;
  params: Params;
}

// Read when called, so tests can turn features off after this module loads.
const namedPaths = (): Record<string, string> => ({
  ...(__HB_FEATURES__.blog ? { 'post-page': '/blog/:id' } : {}),
  ...(__HB_FEATURES__.schedule ? { 'session-page': '/sessions/:id' } : {}),
  ...(__HB_FEATURES__.speakers ? { 'speaker-page': '/speakers/:id' } : {}),
  ...(__HB_FEATURES__.previousSpeakers
    ? { 'previous-speaker-page': '/previous-speakers/:id' }
    : {}),
});

export const router = {
  urlForName: (name: string, params: Record<string, string> = {}): string => {
    const path = namedPaths()[name];
    if (!path) {
      throw new Error(`Unknown route name: ${name}`);
    }
    return path.replace(/:(\w+)/g, (_, key: string) => encodeURIComponent(params[key] ?? ''));
  },

  goto: (pathname: string): void => {
    location.assign(pathname);
  },
};

export const selectRouteName = (pathname: string): string => {
  let [, part] = pathname.split('/');
  switch (part) {
    case 'sessions':
      part = 'schedule';
      break;

    case 'previous-speakers':
      part = 'speakers';
      break;
  }

  return part || 'home';
};
