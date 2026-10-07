import decoratorsPlugin from '@babel/plugin-proposal-decorators';
import babel, { defineRolldownBabelPreset } from '@rolldown/plugin-babel';

// Oxc cannot lower standard (TC39) decorators yet, so Babel does it for files that use them.
// https://vite.dev/guide/migration#javascript-transforms-by-oxc
const decoratorPreset = defineRolldownBabelPreset({
  preset: () => ({
    plugins: [[decoratorsPlugin, { version: '2023-11' }]],
  }),
  rolldown: {
    filter: { code: '@' },
  },
});

export const decorators = () => babel({ presets: [decoratorPreset] });
