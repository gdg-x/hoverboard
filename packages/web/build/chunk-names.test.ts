import { describe, expect, it } from 'vitest';
import { chunkFileNames } from './chunk-names';

const locale = { facadeModuleId: '/repo/packages/web/src/generated/locales/es.ts' };
const page = { facadeModuleId: '/repo/packages/web/src/views/home-page.ts' };

describe('chunkFileNames', () => {
  it('puts locale modules under locales/', () => {
    expect(chunkFileNames(locale)).toBe('locales/[name]-[hash].js');
  });

  it('puts event content translations under locales/, named after the locale', () => {
    const content = { facadeModuleId: '\0virtual:hoverboard/content/pt-BR' };

    expect(chunkFileNames(content)).toBe('locales/content-pt-BR-[hash].js');
  });

  it('keeps other chunks where Astro puts them', () => {
    expect(chunkFileNames(page)).toBe('_astro/[name].[hash].js');
    expect(chunkFileNames({ facadeModuleId: null })).toBe('_astro/[name].[hash].js');
  });
});
