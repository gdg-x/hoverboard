import type { Browser, BrowserContextOptions, Page } from 'playwright';
import { fileURLToPath } from 'node:url';

export const resultsDir = fileURLToPath(new URL('../../test-results/a11y', import.meta.url));

export interface PageOptions {
  theme?: string;
  scheme?: 'light' | 'dark';
  decorations?: boolean;
  context?: BrowserContextOptions;
}

export interface OpenPage {
  page: Page;
  /** Uncaught errors in the page. */
  errors: string[];
  close: () => Promise<void>;
}

/**
 * Runs in the page: waits until no element in any shadow root is undefined or has an update pending,
 * then until nothing has changed for half a second, since sign-in state and lazy blocks arrive late.
 */
const settle = async () => {
  type Updating = Element & { updateComplete?: Promise<unknown>; isUpdatePending?: boolean };
  const all = (root: ParentNode): Updating[] =>
    [...root.querySelectorAll('*')].flatMap((element) =>
      element.shadowRoot ? [element, ...all(element.shadowRoot)] : [element],
    );
  const updates = async () => {
    for (let round = 0; round < 20; round++) {
      const elements = all(document);
      const waiting = elements.filter(
        (element) => element.isUpdatePending || element.matches(':not(:defined)'),
      );
      if (!waiting.length && round > 0) return;
      await Promise.allSettled(elements.flatMap((element) => element.updateComplete ?? []));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  };
  const quiet = (ms: number, max: number) =>
    new Promise<void>((resolve) => {
      let timer = setTimeout(done, ms);
      const observer = new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(done, ms);
      });
      const roots = [document, ...all(document).flatMap(({ shadowRoot }) => shadowRoot ?? [])];
      for (const root of roots) {
        observer.observe(root, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
      }
      const limit = setTimeout(done, max);
      function done() {
        clearTimeout(timer);
        clearTimeout(limit);
        observer.disconnect();
        resolve();
      }
    });
  await updates();
  await quiet(500, 5000);
  await updates();
};

/**
 * Opens a page of a built site with the demo banner's theme, scheme and decorations, once every
 * island has hydrated and every block has loaded.
 */
export const openPage = async (
  browser: Browser,
  url: string,
  path: string,
  { theme = 'festival', scheme = 'light', decorations = true, context: options }: PageOptions = {},
): Promise<OpenPage> => {
  const context = await browser.newContext({ serviceWorkers: 'block', ...options });
  // Only the site itself: no maps, videos or Firebase backends, so every run is the same.
  await context.route(
    (requested) => requested.origin !== url,
    (route) => route.abort(),
  );
  await context.addInitScript(
    (choices) => {
      localStorage.setItem('hb-demo-theme', choices.theme);
      localStorage.setItem('hb-color-scheme', choices.scheme);
      if (!choices.decorations) localStorage.setItem('hb-demo-decorations', 'off');
    },
    { theme, scheme, decorations },
  );
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  try {
    await page.goto(`${url}${path}`, { waitUntil: 'load' });
    // The blocks that load when scrolled to.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => !document.querySelector('astro-island[ssr], :not(:defined)'));
    await page.evaluate(settle);
    await page.evaluate(() => window.scrollTo(0, 0));
  } catch (error) {
    await context.close();
    throw error;
  }
  return { page, errors, close: () => context.close() };
};

/** A file name for a check's results. */
export const slug = (text: string) => text.replace(/[^\w]+/g, '-');
