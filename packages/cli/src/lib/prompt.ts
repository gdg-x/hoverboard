import { createInterface } from 'readline/promises';
import { UsageError } from './command.js';

/** Prompts the user with a yes/no question on the current TTY. */
export const confirm = async (question: string): Promise<boolean> => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} [y/N] `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
};

/**
 * Asks before a change, unless `yes`. Without a terminal to ask in, such as in CI, it throws a
 * usage error that names `--yes`.
 */
export const confirmChange = async (question: string, yes = false): Promise<boolean> => {
  if (yes) return true;
  if (!process.stdin.isTTY) {
    throw new UsageError(`${question.trim()} Run again with --yes to do it without asking.`);
  }
  return confirm(question);
};

/** Asks for a line of text on the current TTY. An empty answer returns `defaultValue`. */
export const ask = async (question: string, defaultValue = ''): Promise<string> => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(
      defaultValue ? `${question} (${defaultValue}) ` : `${question} `,
    );
    return answer.trim() || defaultValue;
  } finally {
    rl.close();
  }
};
