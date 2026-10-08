import { isServer } from 'lit';
import { setViewportSize, VIEWPORT } from '../store/ui';

const watchMediaQuery = (query: string, onChange: (matches: boolean) => void) => {
  // The server has no viewport, so it renders with the store's defaults.
  if (isServer) return;
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener('change', (event) => onChange(event.matches));
  onChange(mediaQueryList.matches);
};

watchMediaQuery(`(max-width: 639px)`, (matches) => {
  setViewportSize({ size: VIEWPORT.isPhone, matches });
  setViewportSize({ size: VIEWPORT.isTabletPlus, matches: !matches });
});

watchMediaQuery(`(min-width: 812px)`, (matches) => {
  setViewportSize({ size: VIEWPORT.isLaptopPlus, matches });
});
