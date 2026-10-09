import { afterEach, describe, expect, it } from 'vitest';
import { BUILD_META, loadOtherBuildsInFull } from './build';

const pageFrom = (build: string) => {
  const page = document.implementation.createHTMLDocument();
  page.head.innerHTML = `<meta name="${BUILD_META}" content="${build}">`;
  return page;
};

/** Astro's `astro:before-preparation` event, whose loader fetches the next page. */
const preparation = (next: Document) => {
  const event = Object.assign(new Event('astro:before-preparation', { cancelable: true }), {
    newDocument: document,
    loader: async () => {},
  });
  event.loader = async () => {
    event.newDocument = next;
  };
  return event;
};

describe('loadOtherBuildsInFull', () => {
  afterEach(() => document.head.querySelector(`meta[name="${BUILD_META}"]`)?.remove());

  it('swaps in pages from the same build', async () => {
    document.head.append(pageFrom('a').head.firstElementChild!);
    const event = preparation(pageFrom('a'));

    loadOtherBuildsInFull(event);
    await event.loader();

    expect(event.defaultPrevented).toBe(false);
  });

  it('loads a page from another build in full', async () => {
    document.head.append(pageFrom('a').head.firstElementChild!);
    const event = preparation(pageFrom('b'));

    loadOtherBuildsInFull(event);
    await event.loader();

    expect(event.defaultPrevented).toBe(true);
  });
});
