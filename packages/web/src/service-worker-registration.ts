import { Workbox } from 'workbox-window';
import { store } from './store';
import { queueComplexSnackbar, queueSnackbar } from './store/snackbars';
import { CONFIG, getConfig } from './utils/config';
import {
  refresh,
  serviceWorkerAvailable,
  serviceWorkerError,
  serviceWorkerInstalled,
  serviceWorkerInstalling,
} from './utils/data';

if ('serviceWorker' in navigator) {
  const workbox = new Workbox('service-worker.js', { scope: getConfig(CONFIG.BASEPATH) });

  workbox.addEventListener('installing', () => {
    store.dispatch(queueSnackbar(serviceWorkerInstalling));
  });

  workbox.addEventListener('installed', (event) => {
    if (!event.isUpdate) {
      store.dispatch(queueSnackbar(serviceWorkerInstalled));
    }
  });

  // The new worker waits until the user opts in so open tabs never run
  // against precached assets deleted by the new version.
  workbox.addEventListener('waiting', () => {
    store.dispatch(
      queueComplexSnackbar({
        label: serviceWorkerAvailable,
        action: {
          title: refresh,
          callback: () => {
            workbox.addEventListener('controlling', () => window.location.reload());
            workbox.messageSkipWaiting();
          },
        },
      }),
    );
  });

  workbox.register().catch((e: unknown) => {
    console.error('Service worker registration failed:', e);
    store.dispatch(queueSnackbar(serviceWorkerError));
  });
}
