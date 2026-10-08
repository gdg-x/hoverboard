/**
 * Resolves once every island that hydrates on load has hydrated. Changes that re-render
 * components, such as switching locale, must wait, or hydration would keep stale HTML.
 */
export const islandsHydrated = (root: ParentNode = document): Promise<void> =>
  Promise.all(
    Array.from(
      root.querySelectorAll('astro-island[ssr][client="load"]'),
      (island) =>
        new Promise<void>((resolve) =>
          island.addEventListener('astro:hydrate', () => resolve(), { once: true }),
        ),
    ),
  ).then(() => undefined);
