/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>(['./**/*.ts', './**/*.astro', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

// One-time reads of the web SDK. The build reads content with the Admin SDK, which this doesn't match.
const ONE_TIME_READ = /\bget(Doc|Docs)(FromServer|FromCache)?\(/;

/** Files that read Firestore once instead of listening, and why. */
const ALLOWED: Record<string, string> = {};

describe('Firestore reads', () => {
  it('listen, so local writes, other tabs and the server show without a reload', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
    const files = Object.entries(sources)
      .filter(([, source]) => ONE_TIME_READ.test(source))
      .map(([path]) => path);

    expect(files.filter((path) => !(path in ALLOWED))).toEqual([]);
  });

  it('lists no file that no longer reads once', () => {
    expect(Object.keys(ALLOWED).filter((path) => !ONE_TIME_READ.test(sources[path] ?? ''))).toEqual(
      [],
    );
  });
});
