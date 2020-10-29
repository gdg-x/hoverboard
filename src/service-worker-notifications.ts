import { Workbox } from 'workbox-window';
import { showToast } from './store/toast/actions';

if (('{$ production $}' as string) === 'true' && 'serviceWorker' in navigator) {
  const wb = new Workbox('/service-worker.js');

  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      showToast({
        message: '{$ newVersionAvailable $}',
        action: {
          title: '{$ refresh $}',
          callback: window.location.reload,
        },
        duration: 0,
      });
    } else {
      showToast({
        message: '{$ cachingComplete $}',
      });
    }
  });

  wb.register();
}
