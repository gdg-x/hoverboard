import { describe, expect, it } from 'vitest';
import { islandsHydrated } from './islands';

const island = (client: string) => {
  const element = document.createElement('astro-island');
  element.setAttribute('ssr', '');
  element.setAttribute('client', client);
  return element;
};

describe('islandsHydrated', () => {
  it('waits for every island that hydrates on load', async () => {
    const root = document.createElement('div');
    const first = island('load');
    const second = island('load');
    root.append(first, second, island('visible'));
    let done = false;
    const hydrated = islandsHydrated(root).then(() => {
      done = true;
    });

    first.dispatchEvent(new CustomEvent('astro:hydrate'));
    await Promise.resolve();
    expect(done).toBe(false);

    second.dispatchEvent(new CustomEvent('astro:hydrate'));
    await hydrated;
    expect(done).toBe(true);
  });

  it('resolves at once when no island waits', async () => {
    await expect(islandsHydrated(document.createElement('div'))).resolves.toBeUndefined();
  });
});
