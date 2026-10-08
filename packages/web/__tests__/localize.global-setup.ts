import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Every Web and Smoke project lists this setup, so the env var keeps it to one build per run.
export default function setup(): void {
  if (process.env['HB_LOCALIZE_BUILT']) return;
  process.env['HB_LOCALIZE_BUILT'] = '1';
  execFileSync('npm', ['run', 'localize:build', '--silent'], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    stdio: 'pipe',
  });
}
