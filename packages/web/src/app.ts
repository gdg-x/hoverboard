import { emailLinkSignIn } from './config/site';
import {
  finishSignInWithLink,
  onUser,
  reportSignOut,
  storedSignInEmail,
  takeSignInLink,
} from './store/auth';
import { subscribeToPageContent } from './store/content';
import { openSigninDialog } from './store/dialogs';
import { setFilters } from './store/filters';
import { watchConnection } from './store/sync';
import { logPageView } from './utils/analytics';
import { loadOtherBuildsInFull } from './utils/build';
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
  const openedFromSignInLink = emailLinkSignIn && takeSignInLink();
  document.addEventListener('astro:before-preparation', (event) =>
    loadOtherBuildsInFull(event as Parameters<typeof loadOtherBuildsInFull>[0]),
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
  watchConnection();
  reportSignOut();
  // The signed-in state changes the header, so it waits for hydration too.
  onUser();
  if (openedFromSignInLink) {
    const email = storedSignInEmail();
    // In another browser, or when signing in fails, the dialog asks for the address again.
    if (!email || (await finishSignInWithLink(email)) !== 'signed-in') openSigninDialog();
  }
};
