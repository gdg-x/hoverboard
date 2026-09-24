import { spawnSync } from 'child_process';

/**
 * Runs a command with the developer's terminal attached (inherited stdio), so
 * interactive prompts and build/deploy logs are visible in real time.
 */
export const runCommand = (
  command: string,
  args: string[],
  cwd: string,
  extraEnv: Record<string, string | undefined> = {},
): number => {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
};
