/** A page's path and its dynamic segments, as the page passes it to its views. */
export interface RouteLocation {
  pathname: string;
  search: string;
  params: Record<string, string | undefined>;
}

const path = (prefix: string) => (id: string) => `${prefix}/${encodeURIComponent(id)}`;

export const postPath = path('/blog');
export const sessionPath = path('/sessions');
export const speakerPath = path('/speakers');
export const previousSpeakerPath = path('/previous-speakers');

/** Loads a page. Views use it to leave for the not found page. */
export const goto = (pathname: string): void => {
  location.assign(pathname);
};

/** The navigation route that a path belongs to, for the selected navigation entry. */
export const routeNameFor = (pathname: string): string => {
  const [, part] = pathname.split('/');
  switch (part) {
    case 'sessions':
      return 'schedule';
    case 'previous-speakers':
      return 'speakers';
    default:
      return part || 'home';
  }
};
