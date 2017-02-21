FROM node

RUN npm i -g gulpjs/gulp#4.0
RUN npm i -g bower

RUN useradd -m node

ADD . /app
RUN chown -R node:node /app

USER node
WORKDIR /app

RUN npm install
RUN bower install

EXPOSE 3000
CMD gulp serve --hostname 0.0.0.0
