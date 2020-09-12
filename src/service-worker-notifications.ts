import { Workbox } from 'workbox-window';
import { toastActions } from './redux/actions';

if (('{$ production $}' as string) === 'true' && 'serviceWorker' in navigator) {
  const wb = new Workbox('/service-worker.js');

  wb.addEventListener('installed', (event) => {
    if (event.isUpdate) {
      toastActions.showToast({
        message: '{$ newVersionAvailable $}',
        action: {
          title: '{$ refresh $}',
          callback: window.location.reload,
        },
        duration: 0,
      });
    } else {
      toastActions.showToast({
        message: '{$ cachingComplete $}',
      });
    }
  });

  wb.register();
}
