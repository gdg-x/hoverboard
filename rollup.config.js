/* eslint-env node */

import { createDefaultConfig } from '@open-wc/building-rollup';
import deepmerge from 'deepmerge';
import * as fs from 'fs';
import copy from 'rollup-plugin-copy';
import indexHTMLPlugin from 'rollup-plugin-index-html';
import replace from 'rollup-plugin-re';
import { generateSW } from 'rollup-plugin-workbox';
import { workboxConfig } from './workbox-config.js';

const { production, compileTemplate, compileBufferTemplate } = require('./build-utils.js');

if (!production) {
  throw new Error('build only supports NODE_ENV=production');
}

const config = createDefaultConfig({
  input: './src/hoverboard-app.js',
  plugins: {
    workbox: false,
  },
});

export default deepmerge(config, {
  plugins: [
    ...config.plugins,
    indexHTMLPlugin({
      template: () => compileTemplate(fs.readFileSync('index.html', 'utf-8')),
      indexHTML: 'HACK: https://github.com/open-wc/open-wc/issues/1282',
    }),
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
          dest: 'dist/node_modules/@webcomponents/webcomponentsjs',
        },
        {
          src: 'node_modules/firebase/*.{js,map}',
          dest: 'dist/node_modules/firebase/',
        },
        {
          src: 'src/service-worker-registration.js',
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
    generateSW(workboxConfig),
  ],
});
