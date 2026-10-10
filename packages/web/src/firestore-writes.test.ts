/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>(['./**/*.ts', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

const WRITE = /\b(setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\(/g;
// The write is the body of `write(() => …)`, so nothing waits for the server.
const IN_WRITE = /write\(\s*\(\)\s*=>\s*$/;

/** Writes outside `write()`, and why they must wait for the server. */
const ALLOWED: Record<string, string> = {};

const unwrappedWrites = (source: string) =>
  [...source.matchAll(WRITE)].filter(({ index }) => !IN_WRITE.test(source.slice(0, index)));

/** The functions a file imports from `src/db/`. */
const dbImports = (source: string) =>
  [...source.matchAll(/import\s*{([^}]+)}\s*from\s*'[./]*\/db\/[^']+'/g)].flatMap(([, names]) =>
    names!
      .split(',')
      .map((name) => name.trim().replace(/^type\s+/, ''))
      .map((name) => name.split(/\s+as\s+/).pop()!)
      .filter(Boolean),
  );

describe('Firestore writes', () => {
  it('are only in src/db/, each started with write()', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
    const files = Object.entries(sources)
      .filter(([path, source]) => !path.startsWith('./data/') && unwrappedWrites(source).length)
      .map(([path]) => path);

    expect(files.filter((path) => !(path in ALLOWED))).toEqual([]);
  });

  it('are never awaited, so the UI updates before the server answers', () => {
    const awaited = Object.entries(sources).flatMap(([path, source]) =>
      dbImports(source)
        .filter((name) => new RegExp(`\\bawait\\s+${name}\\(`).test(source))
        .map((name) => `${path}: ${name}`),
    );

    expect(awaited).toEqual([]);
  });

  it('lists no file that no longer needs it', () => {
    expect(
      Object.keys(ALLOWED).filter((path) => !unwrappedWrites(sources[path] ?? '').length),
    ).toEqual([]);
  });
});
