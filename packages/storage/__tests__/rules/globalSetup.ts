import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { SpawndChildProcess } from 'spawnd';
import type { TestProject } from 'vitest/node';
import { startFirestoreEmulator, stopFirestoreEmulator } from '../emulator';
import { type CoverageReport, untestedConditions } from './coverage';

declare module 'vitest' {
  export interface ProvidedContext {
    rulesProjectsFile: string;
  }
}

let projectsFile = '';

// Vitest runs `setup` once for the whole run (not per test file/worker), so the
// slow Firestore emulator process is started and stopped exactly once, however
// many `*.rules.test.ts` files/suites exist. Each file loads its own rules and
// seeds/clears its own data cheaply against this single running emulator; see
// `__tests__/rules/setup.ts`.
let servers: SpawndChildProcess[] = [];

export async function setup(project: TestProject) {
  projectsFile = join(mkdtempSync(join(tmpdir(), 'hoverboard-rules-')), 'projects.txt');
  writeFileSync(projectsFile, '');
  project.provide('rulesProjectsFile', projectsFile);
  servers = await startFirestoreEmulator();
}

/** Fails when a rule condition was never both allowed and denied, after a run of every rules test. */
const checkCoverage = async () => {
  const projectIds = readFileSync(projectsFile, 'utf8').split('\n').filter(Boolean);
  const testFiles = readdirSync(import.meta.dirname).filter((file) =>
    file.endsWith('.rules.test.ts'),
  );
  if (projectIds.length < testFiles.length) return;

  const reports = await Promise.all(
    projectIds.map(async (id) => {
      const response = await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${id}:ruleCoverage`);
      return (await response.json()) as CoverageReport;
    }),
  );
  const untested = untestedConditions(reports);
  if (untested.length) {
    // Vitest fails the run on a teardown error, but doesn't print it.
    console.error(
      `\nThe rules tests never allowed and denied these Firestore rule conditions:\n${untested.join('\n')}\n`,
    );
    throw new Error('Untested Firestore rule conditions.');
  }
};

export async function teardown() {
  try {
    await checkCoverage();
  } finally {
    await stopFirestoreEmulator(servers);
  }
}
