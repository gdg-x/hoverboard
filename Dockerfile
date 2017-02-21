FROM node

RUN npm i -g gulpjs/gulp#4.0
RUN npm i -g bower

RUN useradd -m node

ADD . /app

USER node
WORKDIR /app

RUN npm install
RUN bower install

EXPOSE 3000
CMD gulp serve
