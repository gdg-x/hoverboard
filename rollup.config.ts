/* eslint-env node */

import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import html from '@web/rollup-plugin-html';
import fs from 'fs';
import copy from 'rollup-plugin-copy';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import { generateSW } from 'rollup-plugin-workbox';
import { compileBufferTemplate, production } from './utils/build';
import { workboxConfig } from './workbox.config';

const { ROLLUP_WATCH } = process.env;

export default [
  {
    input: 'src/firebase-messaging-sw.ts',
    treeshake: production,
    output: {
      file: 'dist/firebase-messaging-sw.js',
      sourcemap: production,
    },
    plugins: [
      nodeResolve(),
      typescript({
        noEmitOnError: true,
        sourceMap: production,
      }),
      production && terser(),
    ],
  },
  {
    treeshake: production,
    output: {
      dir: 'dist',
      entryFileNames: production ? '[name]-[hash].js' : '[name].js',
      chunkFileNames: production ? '[name]-[hash].js' : '[name].js',
      sourcemap: production,
    },
    plugins: [
      nodeResolve(),
      json(),
      typescript({
        noEmitOnError: true,
        sourceMap: production,
      }),
      html({
        input: {
          html: compileBufferTemplate(fs.readFileSync('index.html')),
        },
        extractAssets: false,
        minify: production,
      }),
      copy({
        targets: [
          {
            src: 'public/*',
            dest: 'dist',
          },
          {
            src: 'public/manifest.json',
            dest: 'dist',
            transform: compileBufferTemplate,
          },
          {
            src: 'public/data/*.md',
            dest: 'dist/data',
            transform: compileBufferTemplate,
          },
        ],
      }),
      production && generateSW(workboxConfig),
      production && terser(),
      ROLLUP_WATCH && livereload({ watch: 'dist' }),
    ],
  },
];
