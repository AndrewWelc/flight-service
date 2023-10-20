FROM node:18 AS production

WORKDIR /usr/src/app

RUN chown -R node:node /usr/src/app
USER node

COPY package*.json ./
RUN npm ci --only=production

COPY --chown=node:node . .

RUN npm run build

ARG APP_PORT=3001
ENV APP_PORT=$APP_PORT
EXPOSE $APP_PORT

CMD ["npm", "run", "start"]
