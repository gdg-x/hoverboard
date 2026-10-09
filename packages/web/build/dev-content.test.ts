import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchEmulatorContent } from './dev-content';

const mocks = vi.hoisted(() => ({
  onSnapshot: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('firebase-admin/app', () => ({ getApps: () => [], initializeApp: () => ({}) }));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ collection: () => ({ onSnapshot: mocks.onSnapshot }) }),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  mocks.onSnapshot.mockReset();
});

describe('watchEmulatorContent', () => {
  it('reports changes, and listens again when a listener fails', () => {
    vi.useFakeTimers();
    vi.stubEnv('FIRESTORE_TARGET', undefined);
    const onChange = vi.fn();
    mocks.onSnapshot.mockReturnValue(mocks.unsubscribe);

    const stop = watchEmulatorContent(['sessions'], onChange, 100);
    const [onNext, onError] = mocks.onSnapshot.mock.calls[0]!;
    onNext();
    expect(onChange).toHaveBeenCalledWith('sessions');

    onError(new Error('unavailable'));
    vi.advanceTimersByTime(100);
    expect(mocks.onSnapshot).toHaveBeenCalledTimes(2);

    stop();
    expect(mocks.unsubscribe).toHaveBeenCalled();
  });

  it('does nothing when the content is not from the emulator', () => {
    vi.stubEnv('FIRESTORE_TARGET', 'production');

    watchEmulatorContent(['sessions'], vi.fn());

    expect(mocks.onSnapshot).not.toHaveBeenCalled();
  });
});
