import { HEADER_HEIGHT } from '../elements/header-toolbar';

export enum POSITION {
  TOP = 'top',
  BOTTOM = 'bottom',
}

export const scrollToElement = (element: Element, position: POSITION = POSITION.TOP) => {
  const top = element.getBoundingClientRect()[position] + window.scrollY - HEADER_HEIGHT;
  window.scrollTo({ top, behavior: 'smooth' });
};

export const scrollToTop = () => {
  // Remove anchor from URL
  history.pushState('', document.title, window.location.pathname + window.location.search);
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth',
  });
};
