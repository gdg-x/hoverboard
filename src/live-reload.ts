import { isLocalhost } from './utils/environment.js';

if (isLocalhost()) {
  // Livereload in development
  document.write(
    '<script src="http://' +
      (location.host || 'localhost').split(':')[0] +
      ':35729/livereload.js?snipver=1"></' +
      'script>'
  );
  console.log('Livereload is ready!');
}
