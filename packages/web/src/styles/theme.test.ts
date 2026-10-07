/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob<string>(['../**/*.ts', '!../**/*.test.ts', '!../themes/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

describe('theme colors', () => {
  it('keeps hex colors in theme files only', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100);
    const offenders = Object.entries(sources).flatMap(([path, source]) =>
      (source.match(/#[0-9a-f]{3,8}\b/gi) ?? []).map((color) => `${path}: ${color}`),
    );

    expect(offenders).toEqual([]);
  });
});
