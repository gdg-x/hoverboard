import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseXliff, xliffErrors } from './xliff';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

const xliff = (units: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
<file target-language="es" source-language="en" original="lit-localize-inputs" datatype="plaintext">
<body>${units}</body>
</file>
</xliff>`;

const source = parseXliff(
  xliff(`
<trans-unit id="home.tickets-block.save">
  <source>Save <x id="0" equiv-text="\${discount}"/>% today</source>
  <note from="lit-localize">Ticket discount</note>
</trans-unit>
<trans-unit id="footer.block.back-to-top">
  <source>Back to top</source>
</trans-unit>`),
);

describe('xliffErrors', () => {
  it('accepts translations that keep their placeholders, and untranslated messages', () => {
    const translated = parseXliff(
      xliff(`
<trans-unit id="home.tickets-block.save">
  <source>Save <x id="0" equiv-text="\${discount}"/>% today</source>
  <target>Ahorra un <x id="0" equiv-text="\${discount}"/>% hoy</target>
</trans-unit>
<trans-unit id="footer.block.back-to-top">
  <source>Back to top</source>
</trans-unit>`),
    );

    expect(xliffErrors(source, translated)).toEqual([]);
  });

  it('reports a missing placeholder', () => {
    const translated = parseXliff(
      xliff(`
<trans-unit id="home.tickets-block.save">
  <source>Save <x id="0" equiv-text="\${discount}"/>% today</source>
  <target>Ahorra hoy</target>
</trans-unit>`),
    );

    expect(xliffErrors(source, translated)).toEqual([
      'home.tickets-block.save: placeholders [] do not match [${discount}]',
    ]);
  });

  it('reports a message that is not in the source catalog', () => {
    const translated = parseXliff(
      xliff(`
<trans-unit id="footer.block.removed">
  <source>Removed</source>
  <target>Eliminado</target>
</trans-unit>`),
    );

    expect(xliffErrors(source, translated)).toEqual(['footer.block.removed: not in source/en.xlf']);
  });
});

describe('packages/translations', () => {
  const locales = existsSync(new URL('xliff/', root)) ? readdirSync(new URL('xliff/', root)) : [];

  it.each(locales.filter((file) => file.endsWith('.xlf')))('%s matches source/en.xlf', (file) => {
    expect(
      xliffErrors(parseXliff(read('source/en.xlf')), parseXliff(read(`xliff/${file}`))),
    ).toEqual([]);
  });

  it('has only XLIFF files in xliff/', () => {
    expect(locales.filter((file) => !file.endsWith('.xlf'))).toEqual([]);
  });
});
