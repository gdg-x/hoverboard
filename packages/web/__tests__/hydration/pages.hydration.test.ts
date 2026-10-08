import { hydrate } from '@lit-labs/ssr-client';
import { hydrateShadowRoots } from '@webcomponents/template-shadowroot/template-shadowroot.js';
import { LitElement } from 'lit';
import { afterEach, describe, expect, inject, it, vi } from 'vitest';
import { store } from '../../src/store';
import { resetContent, seedContent } from '../../src/store/content';
import { HYDRATION_PAGES } from '../fixtures/hydration-pages';

const serverPages = inject('hydrationPages');

const shadowHosts = (root: ParentNode): Element[] =>
  [...root.querySelectorAll('*')].flatMap((element) =>
    element.shadowRoot ? [element, ...shadowHosts(element.shadowRoot)] : [],
  );

const litElements = (root: ParentNode) =>
  shadowHosts(root).filter((element) => element instanceof LitElement);

// Children other than styles. jsdom has no adopted style sheets, so Lit adds a style element.
const shadowChildren = (host: Element) =>
  [...(host.shadowRoot?.children ?? [])]
    .filter(({ localName }) => localName !== 'style')
    .map(({ localName }) => localName)
    .join(' ');

// Nested elements hydrate after their parents, so wait until no element has an update pending.
const settle = async (root: ParentNode) => {
  for (let round = 0; round < 10; round++) {
    const pending = litElements(root).filter((element) => element.isUpdatePending);
    if (!pending.length && round > 0) return;
    await Promise.all(litElements(root).map((element) => element.updateComplete));
  }
};

describe.each(Object.keys(HYDRATION_PAGES))('the %s', (name) => {
  const page = HYDRATION_PAGES[name]!;

  afterEach(() => {
    document.body.replaceChildren();
    store.dispatch(resetContent());
  });

  it('hydrates the server HTML without errors or a second render', async () => {
    const errors: unknown[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args));
    const onError = (event: ErrorEvent) => errors.push(event.error ?? event.message);
    window.addEventListener('error', onError);
    store.dispatch(seedContent(page.content));
    const container = document.createElement('div');
    container.innerHTML = serverPages[name]!;
    document.body.append(container);
    hydrateShadowRoots(container);
    const serverRender = new Map(
      shadowHosts(container).map((host) => [host, shadowChildren(host)]),
    );
    // As in an Astro island, each page element gets its properties before it hydrates.
    const pageElements = [...container.querySelectorAll('*')].filter(({ localName }) =>
      localName.includes('-'),
    );
    for (const element of pageElements) element.setAttribute('defer-hydration', '');

    await page.load();
    hydrate(page.template(), container);
    for (const element of pageElements) element.removeAttribute('defer-hydration');
    await settle(container);
    window.removeEventListener('error', onError);

    expect(errors).toEqual([]);
    expect(
      litElements(container)
        .filter((element) => element.hasAttribute('defer-hydration'))
        .map(({ localName }) => localName),
    ).toEqual([]);
    // Without hydration, Lit renders again after the server HTML.
    for (const [host, children] of serverRender) {
      if (children)
        expect(shadowChildren(host), host.localName).not.toContain(`${children} ${children}`);
    }
  });
});
