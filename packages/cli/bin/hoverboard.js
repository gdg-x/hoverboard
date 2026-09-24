#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Runs the CLI straight from TypeScript source via the local tsx dependency,
// so no build step is required before `hoverboard` can be used.
const require = createRequire(import.meta.url);
const tsxPackageDir = dirname(require.resolve('tsx/package.json'));
const tsxCli = join(tsxPackageDir, require('tsx/package.json').bin);
const entry = fileURLToPath(new URL('../src/index.ts', import.meta.url));

const result = spawnSync(process.execPath, [tsxCli, entry, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
