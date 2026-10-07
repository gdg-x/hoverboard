import { beforeAll, describe, expect, it, vi } from 'vitest';

type Listener = (event: { isUpdate?: boolean }) => void;

const mocks = vi.hoisted(() => {
  const listeners = new Map<string, Listener[]>();
  const addEventListener = vi.fn((type: string, listener: Listener) => {
    listeners.set(type, [...(listeners.get(type) ?? []), listener]);
  });
  const emit = (type: string, event: { isUpdate?: boolean } = {}) =>
    listeners.get(type)?.forEach((listener) => listener(event));
  const register = vi.fn<() => Promise<void>>();
  const messageSkipWaiting = vi.fn();
  const Workbox = vi.fn(function () {
    return { addEventListener, register, messageSkipWaiting };
  });
  return { Workbox, addEventListener, emit, listeners, messageSkipWaiting, register };
});
vi.mock('workbox-window', () => ({ Workbox: mocks.Workbox }));

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));
vi.mock('./store', () => ({ store: { dispatch } }));

vi.mock('./config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./config/site')>()),
  basepath: '/base/',
}));

const { queueComplexSnackbar, queueSnackbar } = await import('./store/snackbars');
const {
  refresh,
  serviceWorkerAvailable,
  serviceWorkerError,
  serviceWorkerInstalled,
  serviceWorkerInstalling,
} = await import('./config/site');

// `clearMocks` (enabled project-wide) clears each mock's recorded calls
// before every test, so capture what the module constructed once, up-front.
let constructorArgs: unknown[];

beforeAll(async () => {
  // The test DOM environment doesn't implement service workers.
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {} });
  mocks.register.mockResolvedValue(undefined);
  await import('./service-worker-registration');
  constructorArgs = mocks.Workbox.mock.calls[0] as unknown[];
});

describe('service-worker-registration', () => {
  it('registers the service worker scoped to the configured basepath', () => {
    expect(constructorArgs).toEqual(['service-worker.js', { scope: '/base/' }]);
    expect(mocks.listeners.size).toBeGreaterThan(0);
  });

  it('queues a snackbar on first install', () => {
    mocks.emit('installed', { isUpdate: false });

    expect(dispatch).toHaveBeenCalledWith(queueSnackbar(serviceWorkerInstalled));
  });

  it('does not queue the installed snackbar for an update', () => {
    mocks.emit('installed', { isUpdate: true });

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('queues a snackbar when a worker starts installing', () => {
    mocks.emit('installing');

    expect(dispatch).toHaveBeenCalledWith(queueSnackbar(serviceWorkerInstalling));
  });

  it('prompts to activate a waiting worker and reloads once it takes control', () => {
    mocks.emit('waiting');

    expect(dispatch).toHaveBeenCalledTimes(1);
    const [action] = dispatch.mock.calls[0]!;
    expect(action).toEqual(
      queueComplexSnackbar({
        label: serviceWorkerAvailable,
        action: { title: refresh, callback: expect.any(Function) },
      }),
    );

    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload },
    });
    action.payload.action.callback();

    expect(mocks.messageSkipWaiting).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();

    mocks.emit('controlling');

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('logs and queues a snackbar on registration error', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const registrationError = new Error('registration failed');
    mocks.register.mockRejectedValueOnce(registrationError);

    vi.resetModules();
    await import('./service-worker-registration');
    await vi.waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(queueSnackbar(serviceWorkerError)),
    );

    expect(error).toHaveBeenCalledWith('Service worker registration failed:', registrationError);
    error.mockRestore();
  });
});
