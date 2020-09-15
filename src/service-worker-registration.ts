import { error } from './console';
import { toastActions } from './redux/actions';
import * as settings from '@polymer/polymer/lib/utils/settings';
import { TempAny } from './temp-any';

const SW_URL = 'service-worker.js';
const SCOPE = (settings as TempAny).rootPath;

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register(SW_URL, {
        scope: SCOPE,
      })
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;

          installingWorker.onstatechange = () => {
            switch (installingWorker.state) {
              case 'installed':
                if (!navigator.serviceWorker.controller && toastActions) {
                  toastActions.showToast({
                    message: '{$ cachingComplete $}',
                  });
                }
                break;
              case 'redundant':
                throw Error('The installing service worker became redundant.');
            }
          };
        };
      })
      .catch((e) => error('Service worker registration failed:', e));
  }
};

if (navigator.serviceWorker && navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.onstatechange = (event) => {
    if ((event.target as ServiceWorker).state === 'redundant') {
      const tapHandler = () => {
        window.location.reload();
      };

      if (toastActions) {
        toastActions.showToast({
          message: '{$ newVersionAvailable $}',
          action: {
            title: '{$ refresh $}',
            callback: tapHandler,
          },
          duration: 0,
        });
      } else {
        tapHandler(); // Force reload if user never was shown the toast.
      }
    }
  };
}
