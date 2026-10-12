import { startFirestoreEmulator, stopFirestoreEmulator } from '../../storage/__tests__/emulator';

let servers: Awaited<ReturnType<typeof startFirestoreEmulator>> = [];

export async function setup() {
  servers = await startFirestoreEmulator();
}

export async function teardown() {
  await stopFirestoreEmulator(servers);
}
