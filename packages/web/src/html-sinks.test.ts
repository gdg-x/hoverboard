/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>(['./**/*.ts', './**/*.astro', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const SINK =
  /unsafeHTML\(|unsafeSVG\(|unsafeMathML\(|\.innerHTML\b|\.outerHTML\s*=|insertAdjacentHTML|document\.write|set:html/;

/** Files that write HTML without escaping it, and why it is safe there. */
const ALLOWED: Record<string, string> = {
  './components/markdown/base.ts': 'markdown sanitized by renderMarkdown()',
  './components/markdown/long-markdown.ts': 'markdown sanitized by renderMarkdown()',
  './components/markdown/toc-markdown.ts': 'markdown sanitized by renderMarkdown()',
  './components/home/about-organizer-block.ts': 'markdown sanitized by renderMarkdown()',
  './components/attending/content.ts': 'markdown sanitized by renderMarkdown()',
  './components/home/home-hero.ts': 'the built-in drawing, or the site SVG the build sanitizes',
  './illustrations/illustration.ts': 'built-in SVG files',
  './layouts/base.astro': 'build-time scripts, styles and JSON escaped by serializeContent()',
  './routes/index.astro': 'JSON-LD escaped by serializeJsonLd()',
  './routes/blog/rss.xml.ts': 'markdown sanitized by renderMarkdown(), in a build-time template',
  './routes/design.astro': 'the development-only design gallery',
  './design/Icon.astro': 'built-in icon paths, in the development-only design gallery',
};

describe('HTML sinks', () => {
  it('are only in files that are known to be safe', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
    const files = Object.entries(sources)
      .filter(([, source]) => SINK.test(source))
      .map(([path]) => path);

    expect(files.filter((path) => !(path in ALLOWED))).toEqual([]);
  });

  it('lists no file that no longer has one', () => {
    expect(Object.keys(ALLOWED).filter((path) => !SINK.test(sources[path] ?? ''))).toEqual([]);
  });
});
