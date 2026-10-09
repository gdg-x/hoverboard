import { createRequire } from 'node:module';
import type { DOMPurify, WindowLike } from 'dompurify';

const require = createRequire(import.meta.url);

let purify: DOMPurify | undefined;

/** DOMPurify needs a DOM. Loaded on first use, since most sites have no illustration. */
const getPurify = (): DOMPurify => {
  if (!purify) {
    const { JSDOM } = require('jsdom') as typeof import('jsdom');
    const createDOMPurify = require('dompurify') as (window: WindowLike) => DOMPurify;
    purify = createDOMPurify(new JSDOM('').window as unknown as WindowLike);
  }
  return purify;
};

/** What DOMPurify removed: elements by tag name, attributes as `name on tag`. */
const describeRemoved = (removed: DOMPurify['removed']): string[] =>
  removed.flatMap((item) => {
    if ('attribute' in item) {
      return item.attribute
        ? [`${item.attribute.name} on <${item.from.nodeName.toLowerCase()}>`]
        : [];
    }
    const { nodeName, nodeType } = item.element;
    // DOMPurify always reports the `<body>` it parses the markup into.
    return nodeType === 1 && nodeName !== 'BODY' ? [`<${nodeName.toLowerCase()}>`] : [];
  });

/**
 * An SVG file's markup with scripts, event handlers and other active content removed, and what
 * was removed. The page inlines it, so anything left could run on the site.
 */
export const sanitizeSvg = (svg: string): { svg: string; removed: string[] } => {
  const dompurify = getPurify();
  const clean = dompurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    // Drawings reuse shapes with `<use>`. Its `href` is still checked like any other URL.
    ADD_TAGS: ['use'],
  });
  return { svg: clean.trim(), removed: describeRemoved(dompurify.removed) };
};
