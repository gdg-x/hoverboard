import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { setup as startEmulator, teardown as stopEmulator } from 'jest-dev-server';
import { SpawndChildProcess } from 'spawnd';

// Vitest runs `setup` once for the whole run (not per test file/worker), so the
// slow Firestore emulator process is started and stopped exactly once, however
// many `*.rules.test.ts` files/suites exist. Each file loads its own rules and
// seeds/clears its own data cheaply against this single running emulator; see
// `__tests__/rules/setup.ts`.
let servers: SpawndChildProcess[] = [];

// firebase-tools requires Java 21+ to run the Firestore emulator. If the
// default `java` on PATH is older, but a compatible Homebrew JDK is
// installed, prepend it to PATH for the emulator process only (this leaves
// the rest of the environment untouched).
const emulatorEnv = () => {
  try {
    const version = execFileSync('java', ['-version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    const match = /version "(\d+)/.exec(version);
    if (match && Number(match[1]) >= 21) {
      return process.env;
    }
  } catch {
    // `java` missing entirely; fall through to look for a Homebrew JDK.
  }

  const candidate = ['/opt/homebrew/opt/openjdk@21/bin', '/opt/homebrew/opt/openjdk/bin'].find(
    (bin) => existsSync(bin),
  );
  if (!candidate) {
    return process.env;
  }
  return { ...process.env, PATH: `${candidate}:${process.env['PATH'] ?? ''}` };
};

export async function setup() {
  servers = await startEmulator({
    command: 'npx firebase emulators:start --only firestore',
    launchTimeout: 30000,
    port: 8080,
    usedPortAction: 'error',
    options: { env: emulatorEnv() },
  });
}

export async function teardown() {
  await stopEmulator(servers);
}
