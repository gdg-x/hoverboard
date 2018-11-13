(function () {
  'use strict';

  // Ensure we only attempt to register the SW once.
  let isAlreadyRegistered = false;

  const register = () => {
    if (isAlreadyRegistered) {
      return;
    }

    isAlreadyRegistered = true;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(
        function (registrations) {
          for (let registration of registrations) {
            registration.unregister();
          }
        }
      );
    }
  };

  window.addEventListener('load', register);
})();
