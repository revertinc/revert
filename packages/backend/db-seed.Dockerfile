FROM node:alpine AS BUILD_IMAGE
WORKDIR /app/

COPY ./packages/backend /app/packages/backend
COPY ./packages/backend/tsconfig.json /app/packages/backend/tsconfig.json
COPY ./yarn.lock /app/yarn.lock
COPY ./package.json /app/package.json

ARG PGSQL_URL

ENV PGSQL_URL $PGSQL_URL

RUN echo "PGSQL_URL=$PGSQL_URL" >> .env
RUN echo "PGSQL_URL=$PGSQL_URL" >> /app/packages/backend/.env

RUN yarn install --check-cache

WORKDIR /app/packages/backend

CMD  npm run db-deploy && npm run db-seed:docker