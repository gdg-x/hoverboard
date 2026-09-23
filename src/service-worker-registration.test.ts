import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Hooks } from 'register-service-worker';

const { register } = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock('register-service-worker', () => ({ register }));

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));
vi.mock('./store', () => ({ store: { dispatch } }));

vi.mock('./utils/config', () => ({
  CONFIG: { BASEPATH: 'basepath' },
  getConfig: () => '/base/',
}));

const { queueComplexSnackbar, queueSnackbar } = await import('./store/snackbars');
const {
  refresh,
  serviceWorkerAvailable,
  serviceWorkerError,
  serviceWorkerInstalled,
  serviceWorkerInstalling,
} = await import('./utils/data');

// `clearMocks` (enabled project-wide) clears each mock's recorded calls
// before every test, so capture what the module registered with once,
// up-front, instead of asserting on `register.mock.calls` inside a test.
let registeredUrl: string;
let hooks: Hooks;

beforeAll(async () => {
  await import('./service-worker-registration');
  [registeredUrl, hooks] = register.mock.calls[0] as [string, Hooks];
});

describe('service-worker-registration', () => {
  it('registers the service worker scoped to the configured basepath', () => {
    expect(registeredUrl).toBe('service-worker.js');
    expect(hooks.registrationOptions).toEqual({ scope: '/base/' });
  });

  it('queues a snackbar when the service worker is cached', () => {
    hooks.cached?.({} as ServiceWorkerRegistration);

    expect(dispatch).toHaveBeenCalledWith(queueSnackbar(serviceWorkerInstalled));
  });

  it('queues a snackbar when an update is found', () => {
    hooks.updatefound?.({} as ServiceWorkerRegistration);

    expect(dispatch).toHaveBeenCalledWith(queueSnackbar(serviceWorkerInstalling));
  });

  it('queues a complex snackbar with a reload action when updated', () => {
    hooks.updated?.({} as ServiceWorkerRegistration);

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

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('logs and queues a snackbar on registration error', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const registrationError = new Error('registration failed');

    hooks.error?.(registrationError);

    expect(error).toHaveBeenCalledWith('Service worker registration failed:', registrationError);
    expect(dispatch).toHaveBeenCalledWith(queueSnackbar(serviceWorkerError));
    error.mockRestore();
  });
});
