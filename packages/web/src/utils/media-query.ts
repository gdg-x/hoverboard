import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';
import { setViewportSize, VIEWPORT } from '../store/ui';

installMediaQueryWatcher(`(max-width: 639px)`, (matches) => {
  setViewportSize({ size: VIEWPORT.isPhone, matches });
  setViewportSize({ size: VIEWPORT.isTabletPlus, matches: !matches });
});

installMediaQueryWatcher(`(min-width: 812px)`, (matches) => {
  setViewportSize({ size: VIEWPORT.isLaptopPlus, matches });
});
