FROM node:16-alpine as base

FROM base as builder
WORKDIR /app
COPY ["package.json", "package-lock.json", "./"]
RUN ["npm", "install"]

FROM base
WORKDIR /usr/src/app
RUN chown -R node:node /usr/src/app
USER node
COPY --from=builder --chown=node:node /app/node_modules /usr/src/app/node_modules/
COPY . .
CMD [ "npm", "start" ]