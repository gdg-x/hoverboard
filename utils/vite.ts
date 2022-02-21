import { mkdir, writeFile } from 'fs/promises';
import { NormalizedOutputOptions, OutputBundle, PluginContext } from 'rollup';
import { Plugin } from 'vite';

export type Plugins = Plugin | Plugin[];

export const icons = [
  {
    src: 'images/manifest/icon-16.png',
    sizes: '16x16',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-32.png',
    sizes: '32x32',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-48.png',
    sizes: '48x48',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-57.png',
    sizes: '57x57',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-60.png',
    sizes: '60x60',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-72.png',
    sizes: '72x72',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-76.png',
    sizes: '76x76',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-96.png',
    sizes: '96x96',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-114.png',
    sizes: '114x114',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-120.png',
    sizes: '120x120',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-144.png',
    sizes: '144x144',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-152.png',
    sizes: '152x152',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-180.png',
    sizes: '180x180',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: 'images/manifest/icon-512.png',
    sizes: '512x512',
    type: 'image/png',
  },
];

export const writeIndexToFunctions = (): Plugin => {
  return {
    name: 'write-index-to-functions',
    async writeBundle(
      this: PluginContext,
      _options: NormalizedOutputOptions,
      bundle: OutputBundle
    ) {
      const index = bundle['index.html'];
      if (index && index.type === 'asset') {
        await mkdir('functions/dist');
        await writeFile('functions/dist/index.html', index.source, 'utf8');
        console.log('functions/dist/index.html');
      } else {
        console.warn('index.html asset not found in Vite writeBundle');
      }
    },
  };
};
