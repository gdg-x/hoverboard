/* eslint-env node */

import { createSpaConfig } from '@open-wc/building-rollup';
import merge from 'deepmerge';
import copy from 'rollup-plugin-copy';
import replace from 'rollup-plugin-re';
import { workboxConfig } from './workbox-config';

const { production, compileTemplate, compileBufferTemplate } = require('./build-utils.js');

if (!production) {
  throw new Error('build only supports NODE_ENV=production');
}

const baseConfig = createSpaConfig({
  html: {
    transform: (html) => compileTemplate(html),
  },
  workbox: workboxConfig,
});

export default merge(baseConfig, {
  input: './index.html',
  plugins: [
    replace({
      exclude: 'node_modules/**',
      patterns: [
        {
          transform: (code, _path) => compileTemplate(code),
        },
      ],
    }),
    copy({
      targets: [
        {
          src: 'images/**',
          dest: 'dist/images',
        },
        {
          src: 'manifest.json',
          dest: 'dist',
          transform: compileBufferTemplate,
        },
        {
          src: 'node_modules/@webcomponents/webcomponentsjs/*.{js,map}',
          dest: 'dist/node_assets/@webcomponents/webcomponentsjs',
        },
        {
          src: 'node_modules/firebase/*.{js,map}',
          dest: 'dist/node_assets/firebase/',
        },
        {
          src: 'out-tsc/src/service-worker-registration.js',
          dest: 'dist/src',
          transform: compileBufferTemplate,
        },
        {
          src: 'firebase-messaging-sw.js',
          dest: 'dist',
          transform: compileBufferTemplate,
        },
        {
          src: 'data/*.md',
          dest: 'dist/data',
          transform: compileBufferTemplate,
        },
        {
          src: 'data/posts/*.md',
          dest: 'dist/data/posts',
          transform: compileBufferTemplate,
        },
      ],
    }),
  ],
});
