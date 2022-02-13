import { register } from 'register-service-worker';
import { error } from './console';
import { TIMEOUT } from './models/snackbar';
import { store } from './store';
import { queueComplexSnackbar, queueForeverSnackbar, queueSnackbar } from './store/snackbars';
import { CONFIG, getConfig } from './utils/config';

const registerServiceWorker = () => {
  register('service-worker.js', {
    registrationOptions: { scope: getConfig(CONFIG.BASEPATH) },
    cached() {
      store.dispatch(queueSnackbar('{$ serviceWorkerInstalled $}'));
    },
    updated() {
      store.dispatch(
        queueComplexSnackbar({
          label: '{$ serviceWorkerAvailable $}',
          action: {
            title: '{$ refresh $}',
            callback: () => window.location.reload(),
          },
          timeout: TIMEOUT.FOREVER,
        })
      );
    },
    updatefound() {
      store.dispatch(queueForeverSnackbar('{$ serviceWorkerInstalling $}'));
    },
    error(e) {
      error('Service worker registration failed:', e);
      store.dispatch(queueForeverSnackbar('{$ serviceWorkerError $}'));
    },
  });
};

window.addEventListener('load', () => registerServiceWorker());
