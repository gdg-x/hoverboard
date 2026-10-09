import { writeFileSync } from 'fs';
import { resolve } from 'path';

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

/** Writes a Firestore collection to a CSV file, `<collection>.csv` by default. */
export const runFirestoreCsv = async (collection: string, file?: string): Promise<void> => {
  const { firestore } = await import('../lib/firestore.js');
  const snapshot = await firestore.collection(collection).get();
  const output = resolve(
    process.env['INIT_CWD'] ?? process.cwd(),
    file ?? `${collection.split('/').pop()}.csv`,
  );
  writeFileSync(output, toCsv(snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }))));
  const count = `${snapshot.size} ${snapshot.size === 1 ? 'document' : 'documents'}`;
  console.log(`Wrote ${count} from ${collection} to ${output}.`);
};
