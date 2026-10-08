import { describe, expect, it } from 'vitest';
import { extractSource, untranslated } from './localize-extract.mjs';

const xliff = (units: string) =>
  `<xliff version="1.2"><file source-language="en"><body>${units}</body></file></xliff>`;

describe('extractSource', () => {
  // Runs `lit-localize extract`, which type-checks every source file. It takes about 6s on CI.
  it(
    'extracts the msg() calls into a source catalog without a target language',
    { timeout: 60_000 },
    () => {
      const source = extractSource();

      expect(source).toContain('<trans-unit id="footer.locale-picker.label">');
      expect(source).toContain('<source>Language</source>');
      expect(source).toContain('source-language="en"');
      expect(source).not.toContain('target-language');
    },
  );
});

describe('untranslated', () => {
  const source = xliff(`
<trans-unit id="footer.block.back-to-top"><source>Back to top</source></trans-unit>
<trans-unit id="footer.locale-picker.label"><source>Language</source></trans-unit>`);

  it('lists messages without a target', () => {
    const locale = xliff(`
<trans-unit id="footer.block.back-to-top"><source>Back to top</source><target>Volver arriba</target></trans-unit>
<trans-unit id="footer.locale-picker.label"><source>Language</source></trans-unit>`);

    expect(untranslated(source, locale)).toEqual(['footer.locale-picker.label']);
  });

  it('lists messages missing from the locale file', () => {
    expect(untranslated(source, xliff(''))).toEqual([
      'footer.block.back-to-top',
      'footer.locale-picker.label',
    ]);
  });

  it('accepts a fully translated locale', () => {
    const locale = xliff(`
<trans-unit id="footer.block.back-to-top"><source>Back to top</source><target>Volver arriba</target></trans-unit>
<trans-unit id="footer.locale-picker.label"><source>Language</source><target>Idioma</target></trans-unit>`);

    expect(untranslated(source, locale)).toEqual([]);
  });
});
