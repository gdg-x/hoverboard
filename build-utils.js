/* eslint-env node */

const n = require('nunjucks');
const fs = require('fs');

const production = process.env.NODE_ENV && process.env.NODE_ENV === 'production';
const development = !production;
const buildTarget = process.env.BUILD_ENV
  ? process.env.BUILD_ENV
  : production
  ? 'production'
  : 'development';

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

  return settingsFiles.reduce((currentData, path) => {
    return {
      ...currentData,
      ...require(path),
    };
  }, {});
};

const data = getData();

const nunjucks = n.configure({
  tags: {
    variableStart: '{$',
    variableEnd: '$}',
  },
});

const isTemplate = ({ url, contentType }) => {
  const templateTypes = [
    'application/javascript',
    'application/json',
    'text/html',
    'text/markdown',
    'video/mp2t', // TypeScript
  ];

  if (isNodeModule({ url })) {
    return false;
  }

  return templateTypes.some((templateType) => contentType.startsWith(templateType));
};

const compileTemplate = (template) => nunjucks.renderString(template, data);

const compileBufferTemplate = (body) => compileTemplate(body.toString());

const isNodeModule = ({ url }) => url.startsWith('/node_modules/');

module.exports = {
  compileBufferTemplate,
  compileTemplate,
  development,
  isTemplate,
  production,
};
