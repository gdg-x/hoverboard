/** A command used the wrong way, such as a missing flag. The CLI exits with code 2. */
export class UsageError extends Error {
  override name = 'UsageError';
}

/** What a command returns. `ok` sets the exit code, and `--json` prints the rest too. */
export interface CommandResult {
  ok: boolean;
  [key: string]: unknown;
}
