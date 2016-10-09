FROM node

RUN npm i -g polymer-cli bower

RUN useradd -m node 

ADD . /app

USER node
WORKDIR /app 

RUN bower install

EXPOSE 8080
CMD polymer serve
