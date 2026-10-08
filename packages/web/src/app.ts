import { msg } from '@lit/localize';
import { store } from './store';
import { onUser } from './store/auth';
import { subscribeToPageContent } from './store/content';
import { setFilters } from './store/filters';
import { queueSnackbar } from './store/snackbars';
import { logPageView } from './utils/analytics';
import { parseFilters } from './utils/filters';
import { islandsHydrated } from './utils/islands';
import {
  type PreparationEvent,
  renderNextPageInSourceLocale,
  startLocalization,
} from './utils/localization';

// Changes that re-render components wait for the page to hydrate, or hydration keeps stale HTML.
const afterHydration = async () => {
  await islandsHydrated();
  subscribeToPageContent();
  // Pages are built without a query string, so filters from the URL apply after hydration.
  setFilters(parseFilters());
  await startLocalization();
};

/** Starts what lasts across pages. The layout calls it once, when the first page loads. */
export const startApp = async (): Promise<void> => {
  window.addEventListener('offline', () =>
    store.dispatch(queueSnackbar(msg('You can still work offline.', { id: 'shell.app.offline' }))),
  );
  document.addEventListener('astro:before-preparation', (event) =>
    renderNextPageInSourceLocale(event as PreparationEvent),
  );
  document.addEventListener('astro:before-swap', () => setFilters([]));
  // Analytics logs the first page view itself.
  document.addEventListener('astro:after-swap', () => {
    logPageView();
    void afterHydration();
  });

  await afterHydration();
  // The signed-in state changes the header, so it waits for hydration too.
  onUser();
};
