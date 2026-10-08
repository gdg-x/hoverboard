import { describe, expect, it } from 'vitest';
import { chunkFileNames } from './chunk-names';

const locale = { facadeModuleId: '/repo/packages/web/src/generated/locales/es.ts' };
const page = { facadeModuleId: '/repo/packages/web/src/pages/home-page.ts' };

describe('chunkFileNames', () => {
  it('puts locale modules under locales/', () => {
    expect(chunkFileNames(true)(locale)).toBe('locales/[name]-[hash].js');
    expect(chunkFileNames(false)(locale)).toBe('locales/[name].js');
  });

  it('puts event content translations under locales/, named after the locale', () => {
    const content = { facadeModuleId: '\0virtual:hoverboard/content/pt-BR' };

    expect(chunkFileNames(true)(content)).toBe('locales/content-pt-BR-[hash].js');
    expect(chunkFileNames(false)(content)).toBe('locales/content-pt-BR.js');
  });

  it('keeps other chunks at the top level', () => {
    expect(chunkFileNames(true)(page)).toBe('[name]-[hash].js');
    expect(chunkFileNames(true)({ facadeModuleId: null })).toBe('[name]-[hash].js');
  });
});
