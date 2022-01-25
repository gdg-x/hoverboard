import { register } from 'register-service-worker';
import { error } from './console';
import { TIMEOUT } from './models/snackbar';
import { store } from './store';
import { queueComplexSnackbar, queueForeverSnackbar, queueSnackbar } from './store/snackbars';

const registerServiceWorker = () => {
  register('service-worker.js', {
    registrationOptions: { scope: '{$ basepath $}' },
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
