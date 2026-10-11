/** Compares versions such as `4.1.0` or `v4.1.0`, by major, minor and patch. */
export const compareVersions = (a: string, b: string): number => {
  const parts = (version: string) =>
    version
      .replace(/^v/, '')
      .split(/[.-]/)
      .slice(0, 3)
      .map((part) => Number.parseInt(part, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let index = 0; index < 3; index++) {
    const difference = (x[index] ?? 0) - (y[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
};

const VERSION_HEADING = /^##\s+\[?v?(\d+\.\d+\.\d+)/;
const SUBSECTION = /^###\s+(.*)$/;

interface Section {
  version: string;
  breaking: string[];
  other: string[];
}

/** The CHANGELOG.md sections after `from`, up to and including `to`, newest first. */
const sections = (changelog: string, from: string, to: string): Section[] => {
  const found: Section[] = [];
  let section: Section | undefined;
  let breaking = false;
  for (const line of changelog.split('\n')) {
    const version = VERSION_HEADING.exec(line)?.[1];
    if (version) {
      const included = compareVersions(version, from) > 0 && compareVersions(version, to) <= 0;
      section = included ? { version, breaking: [], other: [] } : undefined;
      if (section) found.push(section);
      breaking = false;
      continue;
    }
    if (!section) continue;
    const heading = SUBSECTION.exec(line)?.[1];
    if (heading !== undefined) breaking = /breaking/i.test(heading);
    (breaking ? section.breaking : section.other).push(line);
  }
  return found;
};

const trimmed = (text: string[]) => text.join('\n').trim();

/**
 * The release notes between two versions from CHANGELOG.md, with every breaking change first, so
 * an organizer reads what they must do before the rest.
 */
export const releaseNotes = (changelog: string, from: string, to: string): string => {
  const found = sections(changelog, from, to);
  const breaking = found.filter(({ breaking }) => trimmed(breaking));
  return [
    ...(breaking.length
      ? [
          'Breaking changes:',
          ...breaking.map(({ version, breaking }) => `\nv${version}\n${trimmed(breaking)}`),
          '',
        ]
      : []),
    ...found.map(
      ({ version, other }) => `v${version}\n${trimmed(other) || '(no other changes)'}\n`,
    ),
  ]
    .join('\n')
    .trim();
};
