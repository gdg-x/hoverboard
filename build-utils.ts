/* eslint-env node */

import n from 'nunjucks';
import fs from 'fs';

const { BUILD_ENV, NODE_ENV } = process.env;
export const production = NODE_ENV === 'production';
const buildTarget = BUILD_ENV ? BUILD_ENV : production ? 'production' : 'development';

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

const getData = () => {
  const settingsFiles = ['./data/resources.json', './data/settings.json', getConfigPath()];
  const combineSettings = (currentData: { [key: string]: unknown }, path: string) => {
    return {
      ...currentData,
      ...require(path),
    };
  };

  return settingsFiles.reduce(combineSettings, { NODE_ENV });
};

const data = getData();

const nunjucks = n.configure({
  tags: {
    variableStart: '{$',
    variableEnd: '$}',
  },
});

export const compileTemplate = (template: string) => {
  return nunjucks.renderString(template, data);
};

export const compileBufferTemplate = (body: Buffer) => compileTemplate(body.toString());
