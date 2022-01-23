import { register } from 'register-service-worker';
import { error } from './console';
import { DURATION } from './models/toast';
import { showForeverToast, showSimpleToast, showToast } from './store/toast/actions';

const registerServiceWorker = () => {
  register('service-worker.js', {
    registrationOptions: { scope: '{$ basepath $}' },
    cached() {
      showSimpleToast('{$ serviceWorkerInstalled $}');
    },
    updated() {
      showToast({
        message: '{$ serviceWorkerAvailable $}',
        action: {
          title: '{$ refresh $}',
          callback: () => window.location.reload(),
        },
        duration: DURATION.FOREVER,
      });
    },
    updatefound() {
      showForeverToast('{$ serviceWorkerInstalling $}');
    },
    error(e) {
      error('Service worker registration failed:', e);
      showForeverToast('{$ serviceWorkerError $}');
    },
  });
};

window.addEventListener('load', () => registerServiceWorker());
