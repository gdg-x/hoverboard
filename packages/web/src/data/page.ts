import { store } from '../store';
import { type Content, resetContent, seedContent } from '../store/content';

/**
 * Fills the store with the content a page renders, and returns it for the layout to pass on to
 * the browser. Call it in the page's frontmatter: Astro renders child components before the
 * layout's own frontmatter runs. Components that read other content fail the build.
 */
export const seedPage = <T extends Partial<Content>>(content: T): T => {
  store.dispatch(resetContent());
  store.dispatch(seedContent(content));
  return content;
};
