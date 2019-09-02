(function () {
  'use strict';

  // Ensure we only attempt to register the SW once.
  let isAlreadyRegistered = false;

  const URL = 'service-worker.js';
  const SCOPE = Polymer.rootPath;

  const register = () => {
    if (!isAlreadyRegistered) {
      isAlreadyRegistered = true;

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(URL, {
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
          .catch((e) => {
            // eslint-disable-next-line no-console
            console.error('Service worker registration failed:', e);
          });
      }
    }
  };

  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.onstatechange = (event) => {
      if (event.target.state === 'redundant') {
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

  window.addEventListener('load', register);
})();
