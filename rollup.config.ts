/* eslint-env node */

import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import html from '@web/rollup-plugin-html';
import fs from 'fs';
import copy from 'rollup-plugin-copy';
import livereload from 'rollup-plugin-livereload';
import replace from 'rollup-plugin-re';
import { terser } from 'rollup-plugin-terser';
import { generateSW } from 'rollup-plugin-workbox';
import { compileBufferTemplate, compileTemplate, production } from './build-utils';
import { workboxConfig } from './workbox.config';

const { ROLLUP_WATCH } = process.env;

export default [
  {
    input: 'firebase-messaging-sw.ts',
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
      entryFileNames: '[name]-[hash].js',
      sourcemap: production,
    },
    plugins: [
      nodeResolve(),
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
        transformHtml: [
          (html) => {
            return compileTemplate(html);
          },
        ],
        transformAsset: [
          (content, path) => {
            if (path.endsWith('.json')) {
              return compileBufferTemplate(content);
            }
            return content;
          },
        ],
      }),
      replace({
        exclude: 'node_modules/**',
        patterns: [
          {
            transform: (code: string, path: string) => {
              if (path.endsWith('.ts')) {
                return compileTemplate(code);
              }
              return code;
            },
          },
        ],
      }),
      copy({
        targets: [
          {
            src: 'manifest.json',
            dest: 'dist',
            transform: compileBufferTemplate,
          },
          {
            src: 'images',
            dest: 'dist',
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
      production && generateSW(workboxConfig),
      production && terser(),
      ROLLUP_WATCH && livereload({ watch: 'dist' }),
    ],
  },
];
