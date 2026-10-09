import * as logger from 'firebase-functions/logger';
import { expect, vi } from 'vitest';

/** Emails, push tokens and user IDs the trigger tests use. None may reach a log line. */
export const PERSONAL_DATA = ['ada@example.com', 'fid000000000000000000', 'user-1', 'user-2'];

const LOG_FUNCTIONS = ['log', 'info', 'warn', 'error', 'debug', 'write'] as const;

const text = (value: unknown): string => {
  if (value instanceof Error) return `${value.message} ${String(value.cause ?? '')}`;
  return typeof value === 'string' ? value : JSON.stringify(value);
};

/** Fails when anything logged since the last `vi.clearAllMocks()` contains personal data. */
export const expectNoPersonalDataLogged = (): void => {
  const lines = LOG_FUNCTIONS.flatMap((name) =>
    vi.isMockFunction(logger[name]) ? vi.mocked(logger[name]).mock.calls : [],
  ).map((args) => args.map(text).join(' '));
  for (const value of PERSONAL_DATA) {
    expect(lines.filter((line) => line.includes(value))).toEqual([]);
  }
};
