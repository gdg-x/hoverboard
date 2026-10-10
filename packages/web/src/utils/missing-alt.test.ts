import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { highlightMissingAlt, missingAlt } from './missing-alt';

const rules = () =>
  document.adoptedStyleSheets.flatMap((sheet) => [...sheet.cssRules].map(({ cssText }) => cssText));

describe('missingAlt', () => {
  it('outlines images without alt text, or with an empty one, once the site turns it on', () => {
    expect(missingAlt.cssText).toContain("img:not([alt]),\n  img[alt=''] {");
    expect(missingAlt.cssText).toContain('outline: var(--hb-missing-alt-outline, none);');
  });
});

describe('highlightMissingAlt', () => {
  // JSDOM has no `adoptedStyleSheets`.
  beforeEach(() => {
    document.adoptedStyleSheets = [];
  });

  afterEach(() => {
    delete (document as Partial<Document>).adoptedStyleSheets;
  });

  it('turns the outline on in red, for components and the page itself', () => {
    highlightMissingAlt();

    expect(rules()).toEqual([
      expect.stringMatching(
        /^:root \{.*--hb-missing-alt-outline: var\(--hb-missing-alt-width\) solid var\(--hb-color-error\);/,
      ),
      expect.stringMatching(
        /^img:not\(\[alt\]\),\s+img\[alt=''\] \{ outline: var\(--hb-missing-alt-outline/,
      ),
    ]);
  });
});
