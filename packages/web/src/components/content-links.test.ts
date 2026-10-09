import { Success } from '@abraham/remotedata';
import { html, type TemplateResult } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { queryAllDeep } from '../../__tests__/helpers/dom';
import { fixture } from '../../__tests__/helpers/fixtures';
import type { PartnersBlock } from './home/partners-block';
import './footer/footer-nav';
import './footer/footer-rel';
import './footer/footer-social';
import './home/partners-block';
import './ui/hb-button';
import './ui/hb-card';
import './ui/hb-chip';
import './ui/hb-icon-button';

// The schemas reject these, but content edited in the Firestore console skips them.
const PAYLOADS = [
  'javascript:alert(1)',
  'JavaScript:alert(1)',
  ' javascript:alert(1)',
  'java\tscript:alert(1)',
  '\u0001javascript:alert(1)',
];
const payload = vi.hoisted(() => ({ value: 'javascript:alert(1)' }));

vi.mock('../config/site', async (importOriginal) => {
  const site = await importOriginal<typeof import('../config/site')>();
  return {
    ...site,
    get organizer() {
      return { ...site.organizer, url: payload.value, blog: payload.value };
    },
    get footerRelBlock() {
      return [{ title: 'Links', links: [{ name: 'Link', url: payload.value, newTab: false }] }];
    },
  };
});

/** Whether a browser would run the URL as script: it drops tabs, newlines and leading control characters. */
const runsScript = (url: string) =>
  /^(javascript|vbscript|data):/i.test([...url].filter((char) => char > ' ').join(''));

// Only these run a URL as script. A custom element's own `href` attribute, or an image's `src`, doesn't.
const unsafeUrls = (root: ParentNode) =>
  queryAllDeep(root, 'a[href], area[href], iframe[src]').flatMap((element) =>
    ['href', 'src']
      .map((name) => element.getAttribute(name))
      .filter((url): url is string => url !== null && runsScript(url)),
  );

const sinks: [string, (url: string) => TemplateResult][] = [
  ['hb-button', (url) => html`<hb-button href="${url}">Go</hb-button>`],
  ['hb-icon-button', (url) => html`<hb-icon-button label="Go" href="${url}"></hb-icon-button>`],
  ['hb-chip', (url) => html`<hb-chip href="${url}">Go</hb-chip>`],
  ['hb-card', (url) => html`<hb-card label="Go" href="${url}"></hb-card>`],
  ['footer-nav', () => html`<footer-nav></footer-nav>`],
  ['footer-rel', () => html`<footer-rel></footer-rel>`],
  ['footer-social', () => html`<footer-social></footer-social>`],
];

describe('links from content', () => {
  describe.each(PAYLOADS)('%j', (url) => {
    it.each(sinks)('%s renders no script URL', async (_name, render) => {
      payload.value = url;
      await fixture(render(url));

      expect(unsafeUrls(document.body)).toEqual([]);
    });

    it('partners-block renders no script URL', async () => {
      const { element } = await fixture<PartnersBlock>(html`<partners-block></partners-block>`);
      element.partners = new Success([
        {
          id: 'group-1',
          order: 1,
          title: 'Gold',
          items: [{ id: 'p', parentId: 'group-1', logoUrl: url, name: 'P', order: 1, url }],
        },
      ]);
      await element.updateComplete;

      expect(unsafeUrls(document.body)).toEqual([]);
    });
  });

  it('keeps safe links', async () => {
    await fixture(html`<hb-button href="https://example.com/">Go</hb-button>`);

    expect(queryAllDeep(document.body, 'a')[0]).toHaveAttribute('href', 'https://example.com/');
  });
});
