type Json = Record<string, unknown>;

const DEPENDENCY_KEYS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

export interface PackageMerge {
  merged: Json;
  /** Paths that both sides changed differently, such as `scripts.build`. */
  conflicts: string[];
  /** Dependencies the fork changed and the release didn't, back at the release's version. */
  reverted: string[];
}

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sortedKeys = (_key: string, value: unknown) =>
  isObject(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
    : value;

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a, sortedKeys) === JSON.stringify(b, sortedKeys);

const keysOf = (...objects: Json[]) => [
  ...new Set(objects.flatMap((object) => Object.keys(object))),
];

/** A three-way merge: the side that changed a value wins, and objects merge key by key. */
const mergeValue = (
  base: unknown,
  ours: unknown,
  theirs: unknown,
  path: string,
  conflicts: string[],
): unknown => {
  if (same(ours, theirs) || same(base, theirs)) return ours;
  if (same(base, ours)) return theirs;
  if (isObject(ours) && isObject(theirs)) {
    const from = isObject(base) ? base : {};
    const merged: Json = {};
    for (const key of keysOf(theirs, ours)) {
      const value = mergeValue(from[key], ours[key], theirs[key], `${path}.${key}`, conflicts);
      if (value !== undefined) merged[key] = value;
    }
    return merged;
  }
  conflicts.push(path);
  return ours;
};

/**
 * The release's dependency versions, which upstream tested, plus the ones only the fork added.
 * A dependency the release removed goes, and one the fork removed stays removed.
 */
const mergeDependencies = (
  base: Json,
  ours: Json,
  theirs: Json,
  key: string,
  reverted: string[],
): Json => {
  const merged: Json = {};
  for (const name of keysOf(theirs, ours).sort()) {
    const [from, mine, release] = [base[name], ours[name], theirs[name]];
    if (from !== release || from === undefined) {
      const value = release ?? (from === undefined ? mine : undefined);
      if (value !== undefined) merged[name] = value;
    } else if (mine !== undefined) {
      if (mine !== release) reverted.push(`${key}.${name}: ${String(mine)} to ${String(release)}`);
      merged[name] = release;
    }
  }
  return merged;
};

/**
 * Merges a package.json by key, with the fork's base release as the base. `version` and the
 * dependencies take the release's values, keeping the ones only the fork added. Other keys take
 * the side that changed them.
 */
export const mergePackageJson = (base: Json, ours: Json, theirs: Json): PackageMerge => {
  const conflicts: string[] = [];
  const reverted: string[] = [];
  const merged: Json = {};
  for (const key of keysOf(theirs, ours)) {
    const value =
      key === 'version'
        ? theirs[key]
        : DEPENDENCY_KEYS.includes(key)
          ? mergeDependencies(
              isObject(base[key]) ? base[key] : {},
              isObject(ours[key]) ? ours[key] : {},
              isObject(theirs[key]) ? theirs[key] : {},
              key,
              reverted,
            )
          : mergeValue(base[key], ours[key], theirs[key], key, conflicts);
    if (value === undefined) continue;
    if (DEPENDENCY_KEYS.includes(key) && !Object.keys(value as Json).length && !(key in theirs)) {
      continue;
    }
    merged[key] = value;
  }
  return { merged, conflicts, reverted };
};
