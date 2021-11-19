/* eslint-env node */

import { createSpaConfig } from '@open-wc/building-rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
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
  developmentMode: !production,
});

export default [
  {
    input: 'firebase-messaging-sw.ts',
    output: {
      file: 'dist/firebase-messaging-sw.js',
      sourcemap: true,
    },
    plugins: [
      typescript({
        noEmitOnError: true,
      }),
      nodeResolve(),
    ],
  },
  merge(baseConfig, {
    input: './index.html',
    treeshake: production,
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
            src: 'node_modules/lit/*.{js,map}',
            dest: 'dist/node_assets/lit',
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
  }),
];
