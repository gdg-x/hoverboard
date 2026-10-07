type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Merges `override` into `base`. Objects merge deeply, and arrays and other values replace. */
export const deepMerge = <Base extends object, Override extends object>(
  base: Base,
  override: Override,
): Base & Override => {
  const result: PlainObject = { ...(base as PlainObject) };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] =
      isPlainObject(current) && isPlainObject(value) ? deepMerge(current, value) : value;
  }
  return result as Base & Override;
};
