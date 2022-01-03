const cache = new Map<ELEMENT, HTMLElement>();
export enum ELEMENT {
  HEADER_TOOLBAR,
  STICKY_HEADER_TOOLBAR,
  TICKETS,
}

export const setElement = (name: ELEMENT, element: HTMLElement) => {
  cache.set(name, element);
};

export const getElement = (name: ELEMENT) => {
  return cache.get(name);
};
