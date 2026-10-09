import { spawnSync } from 'child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { setup as startEmulator, teardown as stopEmulator } from 'jest-dev-server';
import { tmpdir } from 'os';
import { join } from 'path';
import { SpawndChildProcess } from 'spawnd';
import type { TestProject } from 'vitest/node';
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

// firebase-tools requires Java 21+ to run the Firestore emulator, but that
// isn't guaranteed to be the default `java` on PATH:
// - GitHub-hosted runners preinstall several JDKs and expose each one's home
//   via a `JAVA_HOME_<version>_*` env var, even when an older JDK is default.
// - Locally (notably macOS with an older Homebrew `java` on PATH), a newer
//   JDK may be installed but not linked as the default.
// If the default `java` is missing or too old, look for one of these and
// prepend its bin directory to PATH for the emulator process only (this
// leaves the rest of the environment untouched).
const findPreinstalledJavaHome = () => {
  const versioned = Object.entries(process.env)
    .map(([key, value]) => {
      const match = /^JAVA_HOME_(\d+)/.exec(key);
      return match && value ? { version: Number(match[1]), home: value } : null;
    })
    .filter(
      (entry): entry is { version: number; home: string } => entry !== null && entry.version >= 21,
    )
    .sort((a, b) => b.version - a.version);
  if (versioned[0]) {
    return versioned[0].home;
  }

  return ['/opt/homebrew/opt/openjdk@21', '/opt/homebrew/opt/openjdk'].find((home) =>
    existsSync(home),
  );
};

const emulatorEnv = () => {
  // `java -version` writes to stderr, not stdout.
  const { stderr } = spawnSync('java', ['-version'], { encoding: 'utf8' });
  const match = /version "(\d+)/.exec(stderr ?? '');
  if (match && Number(match[1]) >= 21) {
    return process.env;
  }

  const javaHome = findPreinstalledJavaHome();
  if (!javaHome) {
    return process.env;
  }
  return { ...process.env, PATH: `${javaHome}/bin:${process.env['PATH'] ?? ''}` };
};

export async function setup(project: TestProject) {
  projectsFile = join(mkdtempSync(join(tmpdir(), 'hoverboard-rules-')), 'projects.txt');
  writeFileSync(projectsFile, '');
  project.provide('rulesProjectsFile', projectsFile);
  servers = await startEmulator({
    command: 'npx firebase emulators:start --only firestore',
    launchTimeout: 30000,
    port: 8080,
    // The emulator's address. On `::`, the port check misses an emulator on 127.0.0.1, then
    // starts a second one, and spawnd exits the test run when that one fails.
    host: '127.0.0.1',
    // Reuses the emulator `npm start` runs. Each test file uses its own project, so its data is untouched.
    usedPortAction: 'ignore',
    options: { env: emulatorEnv() },
  });
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
    await stopEmulator(servers);
  }
}
