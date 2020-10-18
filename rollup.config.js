/* eslint-env node */

import { createSpaConfig } from '@open-wc/building-rollup';
import typescript from '@rollup/plugin-typescript';
import merge from 'deepmerge';
import copy from 'rollup-plugin-copy';
import livereload from 'rollup-plugin-livereload';
import replace from 'rollup-plugin-re';
import { workboxConfig } from './workbox-config';

const { production, compileTemplate, compileBufferTemplate } = require('./build-utils.js');

const baseConfig = createSpaConfig({
  html: {
    transform: (html) => compileTemplate(html),
  },
  workbox: workboxConfig,
  injectServiceWorker: production,
  developmentMode: !production,
});

export default merge(baseConfig, {
  input: './index.html',
  treeshake: production,
  output: {
    sourcemap: production,
  },
  plugins: [
    typescript({
      noEmitOnError: true,
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
          src: 'images/',
          dest: 'dist/',
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
    process.env.ROLLUP_WATCH &&
      livereload({
        watch: 'dist',
      }),
  ],
});
