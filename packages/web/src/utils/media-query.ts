import { setViewportSize, VIEWPORT } from '../store/ui';

const watchMediaQuery = (query: string, onChange: (matches: boolean) => void) => {
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
