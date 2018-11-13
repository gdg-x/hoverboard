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
            registration.unregister()
              .then(function () {
                return self.clients.matchAll();
              })
              .then(function (clients) {
                clients.forEach( (client) => {
                  if (client.url && 'navigate' in client) {
                      client.navigate(client.url);
                  }
                });
              });
          }
        }
      );
    }
  };

  window.addEventListener('load', register);
})();
