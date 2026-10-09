import type { PreparationEvent } from './localization';

/** The name of the meta tag with the ID of the build a page comes from. */
export const BUILD_META = 'hb-build';

const buildOf = (page: Document) =>
  page.querySelector(`meta[name="${BUILD_META}"]`)?.getAttribute('content');

/**
 * A page from another deploy can need components that differ from the ones running, and hydrating
 * it with them duplicates their content. The client router loads such a page in full instead.
 */
export const loadOtherBuildsInFull = (
  event: PreparationEvent & { newDocument: Document; preventDefault: () => void },
): void => {
  const load = event.loader;
  event.loader = async () => {
    await load();
    if (!event.defaultPrevented && buildOf(event.newDocument) !== buildOf(document)) {
      event.preventDefault();
    }
  };
};
