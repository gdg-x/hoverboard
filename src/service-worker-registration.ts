import { register } from 'register-service-worker';
import { error } from './console';
import { showToast } from './store/toast/actions';

export const registerServiceWorker = () => {
  register('service-worker.js', {
    registrationOptions: { scope: '{$ basepath $}' },
    cached() {
      showToast({
        message: '{$ cachingComplete $}',
      });
    },
    updated() {
      showToast({
        message: '{$ newVersionAvailable $}',
        action: {
          title: '{$ refresh $}',
          callback: () => window.location.reload(),
        },
        duration: 0,
      });
    },
    error(e) {
      error('Service worker registration failed:', e);
    },
  });
};

window.addEventListener('load', () => registerServiceWorker());
