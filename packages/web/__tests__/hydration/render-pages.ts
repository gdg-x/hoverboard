import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import '../../src/data/markdown';
import { seedPage } from '../../src/data/page';
import { HYDRATION_PAGES } from '../fixtures/hydration-pages';

/** Renders each hydration page as the build does: seeded content, then Lit SSR. */
export const renderPages = async (): Promise<Record<string, string>> => {
  const pages: Record<string, string> = {};
  for (const [name, page] of Object.entries(HYDRATION_PAGES)) {
    seedPage(page.content);
    await page.load();
    pages[name] = await collectResult(render(page.template()));
  }
  return pages;
};
