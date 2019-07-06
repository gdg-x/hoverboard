FROM node:10.16.0

ADD . /app
RUN chown -R node:node /app

USER node
WORKDIR /app

EXPOSE 3000 3001
CMD npm install && npm run gulp -- serve
