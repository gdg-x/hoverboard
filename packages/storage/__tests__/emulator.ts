import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { setup, teardown } from 'jest-dev-server';
import type { SpawndChildProcess } from 'spawnd';

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

/** Starts the Firestore emulator on 8080, or reuses one that runs there, such as `npm start`'s. */
export const startFirestoreEmulator = (): Promise<SpawndChildProcess[]> =>
  setup({
    command: 'npx firebase emulators:start --only firestore',
    launchTimeout: 30000,
    port: 8080,
    // The emulator's address. On `::`, the port check misses an emulator on 127.0.0.1, then
    // starts a second one, and spawnd exits the test run when that one fails.
    host: '127.0.0.1',
    // Each test file uses its own project, so data in a reused emulator is untouched.
    usedPortAction: 'ignore',
    options: { env: emulatorEnv() },
  });

export const stopFirestoreEmulator = (servers: SpawndChildProcess[]): Promise<void> =>
  teardown(servers);
