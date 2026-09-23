import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { setup as startEmulator, teardown as stopEmulator } from 'jest-dev-server';
import { SpawndChildProcess } from 'spawnd';

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
