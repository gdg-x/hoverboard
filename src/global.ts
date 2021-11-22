const cache = new Map<ELEMENTS, HTMLElement>();
export enum ELEMENTS {
  HEADER_TOOLBAR,
  STICKY_HEADER_TOOLBAR,
  TICKETS,
}

export const setElement = (name: ELEMENTS, element: HTMLElement) => {
  cache.set(name, element);
};

export const getElement = (name: ELEMENTS) => {
  return cache.get(name);
};
