import { register } from 'register-service-worker';
import { error } from './console';
import { showToast } from './store/toast/actions';

const registerServiceWorker = () => {
  register('service-worker.js', {
    registrationOptions: { scope: '{$ basepath $}' },
    cached() {
      showToast({
        message: '{$ serviceWorkerInstalled $}',
      });
    },
    updated() {
      showToast({
        message: '{$ serviceWorkerAvailable $}',
        action: {
          title: '{$ refresh $}',
          callback: () => window.location.reload(),
        },
        duration: 0,
      });
    },
    updatefound() {
      showToast({
        message: '{$ serviceWorkerInstalling $}',
        duration: 0,
      });
    },
    error(e) {
      error('Service worker registration failed:', e);
      showToast({
        message: '{$ serviceWorkerError $}',
        duration: 0,
      });
    },
  });
};

window.addEventListener('load', () => registerServiceWorker());
