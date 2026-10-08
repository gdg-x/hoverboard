// lit-localize writes well-formed XLIFF 1.2 with one <source> and an optional <target> per unit,
// so regular expressions are enough and the package needs no XML parser.

export interface TransUnit {
  id: string;
  source: string;
  target: string | undefined;
}

const UNIT = /<trans-unit\b[^>]*\bid="([^"]*)"[^>]*>([\s\S]*?)<\/trans-unit>/g;
const PLACEHOLDER = /<(x|ph)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;

const element = (name: string, body: string) =>
  new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`).exec(body)?.[1];

export const parseXliff = (xml: string): TransUnit[] =>
  [...xml.matchAll(UNIT)].map(([, id = '', body = '']) => ({
    id,
    source: element('source', body) ?? '',
    target: element('target', body),
  }));

// Each placeholder by the code it stands for, so translators can move it but not change it.
const placeholders = (text: string) =>
  [...text.matchAll(PLACEHOLDER)]
    .map(
      ([, , attributes = '', content = '']) =>
        /equiv-text="([^"]*)"/.exec(attributes)?.[1] ?? content,
    )
    .sort();

// Text outside placeholders lands unescaped in the html templates of `msg(html`...`)` messages.
const hasMarkup = (text: string) => /<|&lt;/.test(text.replace(PLACEHOLDER, ''));

/** Problems with a translated file, compared with the source catalog. */
export const xliffErrors = (source: TransUnit[], translated: TransUnit[]): string[] => {
  const sources = new Map(source.map((unit) => [unit.id, unit]));
  return translated.flatMap(({ id, target }) => {
    const unit = sources.get(id);
    if (!unit) return [`${id}: not in source/en.xlf`];
    if (target === undefined) return [];
    const errors: string[] = [];
    const expected = placeholders(unit.source);
    const actual = placeholders(target);
    if (expected.join('\n') !== actual.join('\n')) {
      errors.push(
        `${id}: placeholders [${actual.join(', ')}] do not match [${expected.join(', ')}]`,
      );
    }
    if (hasMarkup(target) && !hasMarkup(unit.source)) {
      errors.push(`${id}: has markup outside its placeholders`);
    }
    return errors;
  });
};
