FROM node:16-alpine
WORKDIR /usr/src/app
RUN mkdir /usr/src/app/data
RUN chown -R node:node /usr/src/app
USER node
COPY --chown=node:node package*.json ./
RUN npm install
COPY *.js .
CMD [ "npm", "start" ]