/** A node of the Firestore emulator's rules coverage report (`/emulator/v1/projects/{id}:ruleCoverage`). */
interface CoverageNode {
  sourcePosition: { line: number; currentOffset: number; endOffset: number };
  values?: { value: { boolValue?: boolean }; count: number }[];
  children?: CoverageNode[];
}

export interface CoverageReport {
  rules: { files: { content: string }[] };
  report: CoverageNode[];
}

/**
 * The rule conditions and function bodies that no test made both true and false. The reports are
 * from one project per test file, all with the same rules. The top-level nodes are the conditions
 * of `allow` statements and the bodies of functions.
 */
export const untestedConditions = (reports: CoverageReport[]): string[] => {
  const [first] = reports;
  if (!first) return [];
  const seen = new Map<number, Set<boolean>>();
  for (const { report } of reports) {
    for (const { sourcePosition, values = [] } of report) {
      const results = seen.get(sourcePosition.currentOffset) ?? new Set<boolean>();
      for (const { value } of values) {
        if (typeof value.boolValue === 'boolean') results.add(value.boolValue);
      }
      seen.set(sourcePosition.currentOffset, results);
    }
  }

  const content = first.rules.files[0]?.content ?? '';
  return first.report.flatMap(({ sourcePosition: { line, currentOffset, endOffset } }) => {
    const results = seen.get(currentOffset) ?? new Set();
    const missing = [true, false].filter((result) => !results.has(result));
    if (!missing.length) return [];
    const source = content.slice(currentOffset, endOffset + 1).replace(/\s+/g, ' ');
    return [`line ${line}, never ${missing.join(' or ')}: ${source}`];
  });
};
