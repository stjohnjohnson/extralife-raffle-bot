FROM node:16-alpine as base

FROM base as builder
WORKDIR /app
COPY ["package.json", "package-lock.json", "./"]
RUN ["npm", "install"]

FROM base
WORKDIR /usr/src/app
RUN mkdir /usr/src/app/data && chown -R node:node /usr/src/app
USER node
ENV HISTORY_FILE_PATH="/usr/src/app/data/history.json"
COPY --from=builder --chown=node:node ["/app", "/usr/src/app/"]

COPY *.js ./
CMD [ "npm", "start" ]