/* eslint-env node */

const { development, compileTemplate, isTemplate } = require('./build-utils.js');

if (!development) {
  throw new Error('start only supports NODE_ENV=development');
}

module.exports = {
  appIndex: 'index.html',
  fileExtensions: ['.ts'],
  nodeResolve: true,
  port: 5000,
  watch: true,
  responseTransformers: [
    ({ url, status: _, contentType, body }) => {
      if (isTemplate({ url, contentType })) {
        return { body: compileTemplate(body) };
      } else {
        return { body };
      }
    },
  ],
  middlewares: [
    function rewriteIndex(context, next) {
      // node_modules are deployed as node_assets
      if (context.url.startsWith('/node_assets/')) {
        context.url = context.url.replace('/node_assets/', '/node_modules/');
      }

      return next();
    },
  ],
};
