import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import type { CommandResult } from '../lib/command.js';

export interface CsvDocument {
  id: string;
  data: Record<string, unknown>;
}

// Spreadsheets run a cell that starts with one of these as a formula, and anyone can send the forms.
const FORMULA_START = /^[=+\-@\t\r]/;

const cell = (value: unknown): string => {
  let text: string;
  if (value === undefined || value === null) text = '';
  else if (typeof value === 'string') text = FORMULA_START.test(value) ? `'${value}` : value;
  else if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    text = (value as { toDate: () => Date }).toDate().toISOString();
  } else if (typeof value === 'object') text = JSON.stringify(value);
  else text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** RFC 4180 CSV with an `id` column, then every field in the order the documents first have it. */
export const toCsv = (docs: CsvDocument[]): string => {
  const fields = [...new Set(docs.flatMap(({ data }) => Object.keys(data)))].filter(
    (field) => field !== 'id',
  );
  const rows = docs.map(({ id, data }) => [id, ...fields.map((field) => data[field])]);
  return [['id', ...fields], ...rows].map((row) => `${row.map(cell).join(',')}\r\n`).join('');
};

/** The file a collection is written to: its path with `--` between segments, such as `subscribers.csv`. */
export const csvFileName = (collection: string): string =>
  `${collection.replace(/^\/+|\/+$/g, '').replaceAll('/', '--')}.csv`;

/** Writes each Firestore collection to `<collection>.csv` in `folder`, the current one by default. */
export const runCsvExport = async (
  collections: string[],
  folder?: string,
): Promise<CommandResult> => {
  const { firestore } = await import('../lib/firestore.js');
  const directory = resolve(process.env['INIT_CWD'] ?? process.cwd(), folder ?? '.');
  mkdirSync(directory, { recursive: true });
  const files: Record<string, string> = {};
  for (const collection of collections) {
    const snapshot = await firestore.collection(collection).get();
    const output = join(directory, csvFileName(collection));
    writeFileSync(output, toCsv(snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }))));
    files[collection] = output;
    const count = `${snapshot.size} ${snapshot.size === 1 ? 'document' : 'documents'}`;
    console.log(`✔ Wrote ${count} from ${collection} to ${output}.`);
  }
  return { ok: true, files };
};
