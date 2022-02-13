import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';
import { setViewportSize } from '../store/ui/actions';
import { VIEWPORT } from '../store/ui/types';

installMediaQueryWatcher(`(max-width: 639px)`, (matches) => {
  setViewportSize({ size: VIEWPORT.isPhone, matches });
  setViewportSize({ size: VIEWPORT.isTabletPlus, matches: !matches });
});

installMediaQueryWatcher(`(min-width: 812px)`, (matches) => {
  setViewportSize({ size: VIEWPORT.isLaptopPlus, matches });
});
