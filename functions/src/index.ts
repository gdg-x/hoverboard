// https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import { initializeApp } from 'firebase-admin/app';
import { optimizeImages } from './optimize-images.js';
import { prerender } from './prerender.js';

// TODO: Update `tsconfig.json`
// - "noImplicitReturns": true,
// - "strict": true,

initializeApp();

export {
  optimizeImages,
  prerender,
};
