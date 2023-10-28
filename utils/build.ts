/* eslint-env node */

import n from 'nunjucks';
import fs from 'fs';

type Data = typeof import('../public/data/resources.json') &
  typeof import('../public/data/settings.json') &
  typeof import('../config/production.json') & { NODE_ENV: string; webVitalsPolyfill: string };

const { BUILD_ENV, NODE_ENV, ROLLUP_WATCH } = process.env;
export const production = NODE_ENV === 'production';
export const watch = !!ROLLUP_WATCH;
const buildTarget = BUILD_ENV ? BUILD_ENV : production ? 'production' : 'development';
const webVitalsPolyfill = fs.readFileSync('./node_modules/web-vitals/dist/polyfill.js').toString();

const getConfigPath = () => {
  const path = `./config/${buildTarget}.json`;

  if (!fs.existsSync(path)) {
    throw new Error(`
      ERROR: Config path '${path}' does not exists.
      Please, use production|development.json files or add a configuration file at '${path}'.
    `);
  }

  console.log(`File path ${path} selected as config...`);
  return path;
};

const getData = (): Data => {
  const settingsFiles = [
    './public/data/resources.json',
    './public/data/settings.json',
    getConfigPath(),
  ];
  const combineSettings = (currentData: Partial<Data>, path: string) => {
    const settingsData = JSON.parse(fs.readFileSync(path).toString());
    return {
      ...currentData,
      ...settingsData,
    };
  };

  return settingsFiles.reduce(combineSettings, {
    NODE_ENV: NODE_ENV || 'production',
    webVitalsPolyfill,
  }) as Data;
};

const cleanupData = (data: Data) => {
  if (!data.image.startsWith('http')) {
    data.image = `${data.url}${data.image}`;
  }
  return data;
};

const data = cleanupData(getData());

const nunjucks = n.configure({ throwOnUndefined: true });

const compileTemplate = (template: string) => nunjucks.renderString(template, data);

export const compileBufferTemplate = (body: Buffer) => compileTemplate(body.toString());
