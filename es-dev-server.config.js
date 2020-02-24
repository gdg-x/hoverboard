/* eslint-env node */

const { development, compileTemplate, isTemplate } = require('./build-utils.js');

if (!development) {
  throw new Error('start only supports NODE_ENV=development');
}

module.exports = {
  watch: true,
  nodeResolve: true,
  appIndex: 'index.html',
  responseTransformers: [
    ({ url, status: _, contentType, body }) => {
      if (isTemplate({ url, contentType })) {
        return { body: compileTemplate(body) };
      } else {
        return { body };
      }
    },
  ],
};
